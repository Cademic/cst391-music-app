"use client";

import type { Album, Track } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import TrackLyrics from "./TrackLyrics";
import TrackVideo from "./TrackVideo";
import TracksList from "./TracksList";

interface OneAlbumProps {
  album: Album | null;
}

export default function OneAlbum({ album }: OneAlbumProps) {
  const router = useRouter();
  const tracks = useMemo(
    () => (Array.isArray(album?.tracks) ? album.tracks : []),
    [album]
  );
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  const selectedTrack = useMemo((): Track | null => {
    if (!tracks.length) return null;
    if (
      selectedTrackId != null &&
      tracks.some((t) => t.id === selectedTrackId)
    ) {
      return tracks.find((t) => t.id === selectedTrackId) ?? null;
    }
    return tracks[0] ?? null;
  }, [tracks, selectedTrackId]);

  const listSelectedId = selectedTrack?.id ?? null;

  if (!album) {
    return (
      <div className="container">
        <p>Album not found.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Album Details for {album.title}</h2>
      <div className="row">
        <div className="col col-sm-3">
          <div className="card">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote Wikimedia URLs */}
            <img
              src={album.image ?? ""}
              className="card-img-top"
              alt={album.title}
            />
            <div className="card-body">
              <h5 className="card-title">{album.title}</h5>
              <p className="card-text">{album.description}</p>
              <TracksList
                tracks={tracks}
                selectedTrackId={listSelectedId}
                onSelectTrack={(track) => setSelectedTrackId(track?.id ?? null)}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (album.id != null) router.push(`/edit/${album.id}`);
                }}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
        <div className="col col-sm-9">
          <div className="card mb-3">
            <div className="card-body">
              <TrackLyrics track={selectedTrack} />
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <TrackVideo track={selectedTrack} albumArtist={album.artist} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
