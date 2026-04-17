"use client";

import { albumPathFromFeaturedSong } from "@/lib/album-navigation";
import type { FeaturedSongDto } from "@/lib/theaudiodb-search-map";
import {
  deletePlaylist,
  fetchPlaylistDetail,
  fetchMyPlaylists,
} from "@/lib/playlist-api";
import CreatePlaylistModal from "@/components/music/CreatePlaylistModal";
import DeletePlaylistModal from "@/components/music/DeletePlaylistModal";
import UniversalSongSearchBar from "@/components/music/UniversalSongSearchBar";
import type { PlaylistSummary } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

const PLAYLIST_CARD_COLORS = [
  "var(--wf-playlist-1)",
  "var(--wf-playlist-2)",
  "var(--wf-playlist-3)",
];

interface PlaylistMembershipState {
  trackIds: number[];
  recordingMap: Record<string, number>;
  coverImages: string[];
}

function toPlaylistMembershipState(
  tracks: Array<{ trackId: number; recordingMbid?: string | null; albumImage?: string | null }>
): PlaylistMembershipState {
  const coverImages = tracks
    .map((track) => track.albumImage?.trim() ?? "")
    .filter((image): image is string => image.length > 0);

  return {
    trackIds: tracks.map((track) => track.trackId),
    recordingMap: tracks.reduce<Record<string, number>>((acc, track) => {
      if (typeof track.recordingMbid === "string" && track.recordingMbid.length > 0) {
        acc[track.recordingMbid] = track.trackId;
      }
      return acc;
    }, {}),
    coverImages,
  };
}

export default function Page() {
  const router = useRouter();
  const { status } = useSession();
  const [featuredSongs, setFeaturedSongs] = useState<FeaturedSongDto[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [songLoadNote, setSongLoadNote] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const songCarouselRef = useRef<HTMLDivElement | null>(null);
  const playlistCarouselRef = useRef<HTMLDivElement | null>(null);
  const songCarouselPointerIdRef = useRef<number | null>(null);
  const songCarouselPointerStartXRef = useRef<number | null>(null);
  const songCarouselScrollStartRef = useRef(0);
  const songCarouselIsSwipingRef = useRef(false);
  const [playlistMembership, setPlaylistMembership] = useState<
    Record<string, PlaylistMembershipState>
  >({});
  const [isSongCarouselDragging, setIsSongCarouselDragging] = useState(false);
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PlaylistSummary | null>(null);
  const [deletingPlaylistId, setDeletingPlaylistId] = useState<string | null>(null);

  useEffect(() => {
    setFeaturedLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/music/featured-songs", {
          cache: "no-store",
        });
        const json: unknown = await res.json();
        if (
          !res.ok ||
          typeof json !== "object" ||
          json === null ||
          !Array.isArray((json as { items?: unknown }).items)
        ) {
          setFeaturedSongs([]);
          setSongLoadNote("Featured songs could not load from TheAudioDB.");
          return;
        }
        setFeaturedSongs((json as { items: FeaturedSongDto[] }).items);
        setSongLoadNote(null);
      } catch (e) {
        console.error(e);
        setFeaturedSongs([]);
        setSongLoadNote("Featured songs could not load from TheAudioDB.");
      } finally {
        setFeaturedLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      setPlaylistMembership({});
      return;
    }
    let cancelled = false;
    fetchMyPlaylists()
      .then((data) => {
        if (!cancelled) {
          setPlaylists(data);
          setPlaylistError(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setPlaylistError(e.message);
          setPlaylists([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || playlists.length === 0) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const details = await Promise.allSettled(
        playlists.map((playlist) => fetchPlaylistDetail(playlist.id))
      );
      if (cancelled) {
        return;
      }
      const nextMembership: Record<string, PlaylistMembershipState> = {};
      for (let i = 0; i < playlists.length; i += 1) {
        const playlist = playlists[i];
        const detail = details[i];
        if (!playlist || !detail || detail.status !== "fulfilled") {
          continue;
        }
        nextMembership[playlist.id] = toPlaylistMembershipState(detail.value.tracks);
      }
      setPlaylistMembership(nextMembership);
    })();
    return () => {
      cancelled = true;
    };
  }, [status, playlists]);


  const songCarouselItems = useMemo(
    () =>
      featuredSongs.map((song) => ({
        id: song.idTrack,
        title: song.title,
        artist: song.artist,
        coverArtUrl: song.coverArtUrl,
        albumId: song.albumId,
        album: song.album,
        trackNumber: song.trackNumber,
      })),
    [featuredSongs]
  );
  const greetingLabel = useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      return "Good Morning";
    }
    if (currentHour < 18) {
      return "Good Afternoon";
    }
    return "Good Evening";
  }, []);

  function goGetStarted() {
    if (status === "authenticated") {
      setCreatingOpen(true);
      return;
    }
    router.push("/auth/signin?callbackUrl=/library");
  }

  function handleCreatedPlaylist(playlist: PlaylistSummary) {
    setPlaylists((prev) => [playlist, ...prev]);
    setCreatingOpen(false);
  }

  function scrollSongCarousel(direction: "left" | "right") {
    const container = songCarouselRef.current;
    if (!container) return;
    const amount = Math.max(240, Math.floor(container.clientWidth * 0.75));
    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  function scrollPlaylistCarousel(direction: "left" | "right") {
    const container = playlistCarouselRef.current;
    if (!container) return;
    const amount = Math.max(240, Math.floor(container.clientWidth * 0.75));
    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  function handleEditPlaylist(playlist: PlaylistSummary) {
    router.push(`/playlists/${playlist.id}?edit=1`);
  }

  async function handleDeletePlaylist() {
    if (!pendingDelete) return;
    setDeletingPlaylistId(pendingDelete.id);
    setPlaylistError(null);
    try {
      await deletePlaylist(pendingDelete.id);
      setPlaylists((prev) => prev.filter((row) => row.id !== pendingDelete.id));
      setPlaylistMembership((prev) => {
        const next = { ...prev };
        delete next[pendingDelete.id];
        return next;
      });
      setPendingDelete(null);
    } catch (e) {
      setPlaylistError(e instanceof Error ? e.message : "Could not delete playlist.");
    } finally {
      setDeletingPlaylistId(null);
    }
  }

  function onSongCarouselPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) {
      return;
    }
    const target = e.target as HTMLElement | null;
    // Do not capture the pointer when starting on a song card — capture would
    // swallow the click so navigation (router.push) never runs.
    if (target?.closest(".wf-song-pill-card")) {
      return;
    }
    songCarouselPointerIdRef.current = e.pointerId;
    songCarouselPointerStartXRef.current = e.clientX;
    songCarouselScrollStartRef.current = e.currentTarget.scrollLeft;
    songCarouselIsSwipingRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsSongCarouselDragging(true);
  }

  function onSongCarouselPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (
      songCarouselPointerIdRef.current !== e.pointerId ||
      songCarouselPointerStartXRef.current === null
    ) {
      return;
    }
    const deltaX = e.clientX - songCarouselPointerStartXRef.current;
    if (Math.abs(deltaX) > 6) {
      songCarouselIsSwipingRef.current = true;
    }
    e.currentTarget.scrollLeft = songCarouselScrollStartRef.current - deltaX;
    e.preventDefault();
  }

  function onSongCarouselPointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    if (songCarouselPointerIdRef.current !== e.pointerId) {
      return;
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    songCarouselPointerIdRef.current = null;
    songCarouselPointerStartXRef.current = null;
    setIsSongCarouselDragging(false);
    window.setTimeout(() => {
      songCarouselIsSwipingRef.current = false;
    }, 120);
  }

  return (
    <>
          <section className="wf-hero" aria-label="Welcome">
            <div className="wf-hero-inner">
              <div className="wf-hero-topbar">
                <div className="wf-hero-search">
                  <Suspense fallback={null}>
                    <UniversalSongSearchBar ariaLabel="Search all songs" />
                  </Suspense>
                </div>
                {status === "authenticated" ? (
                  <button
                    type="button"
                    className="wf-pill wf-pill--auth"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    LOG OUT
                  </button>
                ) : (
                  <div className="d-flex align-items-center gap-2">
                    <Link className="wf-pill wf-pill--auth" href="/auth/signin">
                      SIGN IN
                    </Link>
                    <Link
                      className="wf-pill wf-pill--auth"
                      href="/auth/register"
                    >
                      REGISTER
                    </Link>
                  </div>
                )}
              </div>
              <div className="wf-hero-content">
                <div className="wf-hero-copy">
                  <h1 className="wf-hero-title">{greetingLabel}</h1>
                  <p className="wf-hero-line1">Start your day with music</p>
                </div>
                <div className="d-flex flex-wrap gap-2 wf-hero-actions">
                  <button type="button" className="wf-btn-cta" onClick={goGetStarted}>
                    Library
                  </button>
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4"
                    onClick={() => router.push("/discover")}
                  >
                    Browse discover
                  </button>
                </div>
              </div>
            </div>
          </section>

      <section
        id="featured-songs"
        className="wf-section"
        aria-labelledby="songs-heading"
      >
        <div className="wf-section-head">
          <h2 id="songs-heading" className="wf-section-title">
            Featured songs
          </h2>
          <div className="wf-section-rule" aria-hidden />
        </div>
        {songLoadNote ? <p className="text-muted mb-0">{songLoadNote}</p> : null}
        {featuredLoading ? (
          <div className="wf-featured-scroll" aria-hidden>
            {Array.from({ length: 6 }).map((_, idx) => (
              <span
                key={`song-skeleton-${idx}`}
                className="wf-song-pill-card wf-song-pill-card--skeleton wf-stagger-in"
                style={{ animationDelay: `${idx * 70}ms` }}
              />
            ))}
          </div>
        ) : songCarouselItems.length === 0 ? (
          <p className="text-muted mb-0">
            Song highlights appear here once top tracks are available.
          </p>
        ) : (
          <div className="wf-carousel-shell">
            <button
              type="button"
              className="wf-carousel-arrow wf-carousel-arrow-left"
              aria-label="Scroll featured songs left"
              onClick={() => scrollSongCarousel("left")}
            >
              {"<"}
            </button>
            <div
              ref={songCarouselRef}
              className={`wf-featured-scroll ${isSongCarouselDragging ? "is-dragging" : ""}`}
              onPointerDown={onSongCarouselPointerDown}
              onPointerMove={onSongCarouselPointerMove}
              onPointerUp={onSongCarouselPointerEnd}
              onPointerCancel={onSongCarouselPointerEnd}
            >
            {songCarouselItems.map((song, idx) => (
                <button
                  key={song.id}
                  type="button"
                  className={`wf-song-pill-card wf-stagger-in ${
                    !song.albumId ? "wf-song-pill-card--unavailable" : ""
                  }`}
                  style={{ animationDelay: `${idx * 55}ms` }}
                  onClick={() => {
                    if (songCarouselIsSwipingRef.current) {
                      return;
                    }
                    const path = albumPathFromFeaturedSong({
                      idTrack: song.id,
                      albumId: song.albumId,
                    });
                    if (path) {
                      router.push(path);
                    }
                  }}
                  aria-disabled={!song.albumId}
                >
                  {song.coverArtUrl ? (
                    <span className="wf-song-pill-media" aria-hidden>
                      {/* eslint-disable-next-line @next/next/no-img-element -- remote cover art */}
                      <img
                        src={song.coverArtUrl}
                        alt={`${song.title} cover`}
                        className="wf-song-pill-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </span>
                  ) : (
                    <span className="wf-song-pill-icon" aria-hidden>
                      ♪
                    </span>
                  )}
                  <span className="wf-song-pill-content">
                    <span className="wf-song-pill-title">{song.title}</span>
                    <span className="wf-song-pill-subtitle">
                      {song.trackNumber != null ? `${song.trackNumber}. ` : ""}
                      {song.artist}
                      {song.album ? ` • ${song.album}` : ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="wf-carousel-arrow wf-carousel-arrow-right"
              aria-label="Scroll featured songs right"
              onClick={() => scrollSongCarousel("right")}
            >
              {">"}
            </button>
          </div>
        )}
      </section>

      {status === "authenticated" ? (
        <section className="wf-section" aria-labelledby="playlists-heading">
          <div className="wf-section-head">
            <h2 id="playlists-heading" className="wf-section-title">
              Playlists
            </h2>
            <div className="wf-section-rule" aria-hidden />
          </div>

          <button
            type="button"
            className="wf-create-btn d-inline-block mb-3 text-decoration-none border-0"
            onClick={() => setCreatingOpen(true)}
          >
            Create New
          </button>

          {playlistError ? (
            <p className="text-danger small">{playlistError}</p>
          ) : playlists.length === 0 ? (
            <p className="text-muted mb-0">
              Start with a name, drop in songs you love, and keep building until it feels
              like you. Use <strong>Create New</strong> or open{" "}
              <Link href="/library">Playlists</Link> to begin.
            </p>
          ) : (
            <div className="wf-carousel-shell">
              <button
                type="button"
                className="wf-carousel-arrow wf-carousel-arrow-left"
                aria-label="Scroll playlists left"
                onClick={() => scrollPlaylistCarousel("left")}
              >
                {"<"}
              </button>
              <div ref={playlistCarouselRef} className="wf-playlist-row">
                {playlists.map((p, i) => (
                  <div
                    key={p.id}
                    className="position-relative wf-playlist-item wf-slide-in-ltr"
                    style={{ animationDelay: `${i * 65}ms` }}
                  >
                    {(() => {
                      const isMembershipLoading =
                        p.trackCount > 0 && playlistMembership[p.id] == null;
                      return (
                    <Link
                      href={`/library/${p.id}`}
                      className={`wf-playlist-card ${
                        isMembershipLoading ? "wf-playlist-card--loading" : ""
                      }`}
                      style={{ background: PLAYLIST_CARD_COLORS[i % PLAYLIST_CARD_COLORS.length] }}
                    >
                      <div className="wf-playlist-card-inner">
                        {playlistMembership[p.id]?.coverImages.length >= 4 ? (
                          <span className="wf-playlist-collage" aria-hidden>
                            {playlistMembership[p.id]?.coverImages.slice(0, 4).map((image, imageIdx) => (
                              // eslint-disable-next-line @next/next/no-img-element -- remote album art URLs
                              <img
                                key={`${p.id}-cover-${imageIdx}`}
                                src={image}
                                alt=""
                                className="wf-playlist-collage-image"
                              />
                            ))}
                          </span>
                        ) : playlistMembership[p.id]?.coverImages.length ? (
                          <span className="wf-playlist-cover-single" aria-hidden>
                            {/* eslint-disable-next-line @next/next/no-img-element -- remote album art URLs */}
                            <img
                              src={playlistMembership[p.id].coverImages[0]}
                              alt=""
                              className="wf-playlist-cover-single-image"
                            />
                          </span>
                        ) : (
                        <span className="wf-playlist-empty-art" aria-hidden>
                          <span className="wf-playlist-empty-glow" />
                          </span>
                        )}
                        <span className="wf-playlist-meta">
                          <span className="wf-playlist-title">{p.name}</span>
                          <span className="wf-playlist-subtitle">
                          {p.trackCount > 0
                            ? `${p.trackCount} ${p.trackCount === 1 ? "song" : "songs"}`
                            : "Add songs to get started"}
                          </span>
                        </span>
                      </div>
                    </Link>
                      );
                    })()}
                    <div className="dropdown wf-dropdown-animated position-absolute top-0 end-0 m-2">
                      <button
                        type="button"
                        className="wf-song-card-menu"
                        data-bs-toggle="dropdown"
                        aria-label={`Playlist options for ${p.name}`}
                      >
                        <span className="wf-playlist-card-menu-icon" aria-hidden>
                          <span className="wf-playlist-card-menu-dot" />
                          <span className="wf-playlist-card-menu-dot" />
                          <span className="wf-playlist-card-menu-dot" />
                        </span>
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end">
                        <li>
                          <button
                            type="button"
                            className="dropdown-item"
                            onClick={() => handleEditPlaylist(p)}
                          >
                            Edit
                          </button>
                        </li>
                        <li>
                          <Link className="dropdown-item" href={`/library/${p.id}`}>
                            Open
                          </Link>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="dropdown-item text-danger"
                            onClick={() => setPendingDelete(p)}
                          >
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="wf-carousel-arrow wf-carousel-arrow-right"
                aria-label="Scroll playlists right"
                onClick={() => scrollPlaylistCarousel("right")}
              >
                {">"}
              </button>
            </div>
          )}
        </section>
      ) : null}

      {status !== "authenticated" ? (
        <section className="wf-guest-cta" aria-label="Sign in prompt">
          <p className="wf-guest-cta-title">Unlock your personal sound world.</p>
          <p className="wf-guest-cta-copy">
            Sign in to save playlists, discover tailored picks, and keep every vibe one tap away.
          </p>
          <Link className="wf-guest-cta-link" href="/auth/signin?callbackUrl=/">
            Sign in and start listening
          </Link>
        </section>
      ) : null}
      {pendingDelete ? (
        <DeletePlaylistModal
          playlistName={pendingDelete.name}
          isDeleting={deletingPlaylistId === pendingDelete.id}
          error={playlistError}
          onCancel={() => {
            if (deletingPlaylistId) return;
            setPendingDelete(null);
          }}
          onConfirm={() => void handleDeletePlaylist()}
        />
      ) : null}
      {creatingOpen ? (
        <CreatePlaylistModal
          onCancel={() => setCreatingOpen(false)}
          onCreated={handleCreatedPlaylist}
        />
      ) : null}

    </>
  );
}
