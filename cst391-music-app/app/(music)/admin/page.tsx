"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Fragment, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import DeletePlaylistModal from "@/components/music/DeletePlaylistModal";
import {
  createAdminAlbum,
  createAdminTrack,
  deleteAdminAlbum,
  deleteAdminTrack,
  deleteAdminUser,
  fetchAdminAlbumDetail,
  fetchAdminAlbums,
  fetchAdminUsers,
  updateAdminAlbum,
  updateAdminTrack,
} from "@/lib/admin-api";
import {
  deletePlaylistAdmin,
  fetchAdminPlaylists,
  fetchPlaylistDetail,
  removeTrackFromPlaylist,
} from "@/lib/playlist-api";
import type {
  AdminAlbumDetail,
  AdminAlbumSummary,
  AdminTrackCreatePayload,
  AdminTrackSummary,
  AdminUserSummary,
  AlbumCreatePayload,
  PlaylistDetailTrack,
  PlaylistSummary,
} from "@/lib/types";

type AdminTabKey = "users" | "playlists" | "albums";
type AdminDeleteTarget =
  | { kind: "user"; id: string; title: string; message: string }
  | { kind: "album"; id: number; title: string; message: string }
  | { kind: "track"; id: number; albumId?: number; title: string; message: string }
  | {
      kind: "playlistTrack";
      id: number;
      playlistId: string;
      title: string;
      message: string;
    };

const defaultAlbumForm: AlbumCreatePayload = {
  title: "",
  artist: "",
  year: new Date().getFullYear(),
  description: "",
  image: "",
  tracks: [],
};

const defaultTrackForm: AdminTrackCreatePayload = {
  albumId: 0,
  number: 1,
  title: "",
  lyrics: "",
  video: "",
};

const defaultEditAlbumForm = {
  title: "",
  artist: "",
  year: new Date().getFullYear(),
  image: "",
  description: "",
};

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<AdminTabKey>("users");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [albums, setAlbums] = useState<AdminAlbumSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PlaylistSummary | null>(null);
  const [albumForm, setAlbumForm] = useState<AlbumCreatePayload>(defaultAlbumForm);
  const [trackForm, setTrackForm] = useState<AdminTrackCreatePayload>(defaultTrackForm);
  const [submittingAlbum, setSubmittingAlbum] = useState(false);
  const [submittingTrack, setSubmittingTrack] = useState(false);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [createdAlbumId, setCreatedAlbumId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingAlbumId, setDeletingAlbumId] = useState<number | null>(null);
  const [isEditAlbumModalOpen, setIsEditAlbumModalOpen] = useState(false);
  const [loadingEditAlbum, setLoadingEditAlbum] = useState(false);
  const [savingEditAlbum, setSavingEditAlbum] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<AdminAlbumDetail | null>(null);
  const [editAlbumForm, setEditAlbumForm] = useState(defaultEditAlbumForm);
  const [isEditTrackModalOpen, setIsEditTrackModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<AdminTrackSummary | null>(null);
  const [savingEditTrack, setSavingEditTrack] = useState(false);
  const [deletingTrackId, setDeletingTrackId] = useState<number | null>(null);
  const [pendingDeleteTarget, setPendingDeleteTarget] = useState<AdminDeleteTarget | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [expandedPlaylistIds, setExpandedPlaylistIds] = useState<string[]>([]);
  const [expandedAlbumIds, setExpandedAlbumIds] = useState<number[]>([]);
  const [playlistTracksById, setPlaylistTracksById] = useState<
    Record<string, PlaylistDetailTrack[]>
  >({});
  const [albumTracksById, setAlbumTracksById] = useState<Record<number, AdminTrackSummary[]>>({});
  const [loadingPlaylistTracksId, setLoadingPlaylistTracksId] = useState<string | null>(null);
  const [loadingAlbumTracksId, setLoadingAlbumTracksId] = useState<number | null>(null);
  const [openingPlaylistIds, setOpeningPlaylistIds] = useState<string[]>([]);
  const [collapsingPlaylistIds, setCollapsingPlaylistIds] = useState<string[]>([]);
  const [openingAlbumIds, setOpeningAlbumIds] = useState<number[]>([]);
  const [collapsingAlbumIds, setCollapsingAlbumIds] = useState<number[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, playlistsRes, albumsRes] = await Promise.all([
        fetchAdminUsers(),
        fetchAdminPlaylists(),
        fetchAdminAlbums(),
      ]);
      setUsers(usersRes);
      setPlaylists(playlistsRes);
      setAlbums(albumsRes);
      if (albumsRes.length > 0 && trackForm.albumId === 0) {
        setTrackForm((prev) => ({ ...prev, albumId: albumsRes[0].id }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [trackForm.albumId]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      void load();
    }
  }, [status, session?.user?.role, load]);

  useEffect(() => {
    if (
      !isAlbumModalOpen &&
      !isTrackModalOpen &&
      !isEditAlbumModalOpen &&
      !isEditTrackModalOpen &&
      !pendingDeleteTarget
    ) {
      document.documentElement.classList.remove("wf-modal-open");
      document.body.classList.remove("wf-modal-open");
      return;
    }
    document.documentElement.classList.add("wf-modal-open");
    document.body.classList.add("wf-modal-open");
    return () => {
      document.documentElement.classList.remove("wf-modal-open");
      document.body.classList.remove("wf-modal-open");
    };
  }, [
    isAlbumModalOpen,
    isTrackModalOpen,
    isEditAlbumModalOpen,
    isEditTrackModalOpen,
    pendingDeleteTarget,
  ]);

  const loweredQuery = query.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!loweredQuery) return users;
    return users.filter((user) =>
      `${user.name ?? ""} ${user.email} ${user.role}`.toLowerCase().includes(loweredQuery)
    );
  }, [loweredQuery, users]);

  const filteredPlaylists = useMemo(() => {
    if (!loweredQuery) return playlists;
    return playlists.filter((playlist) =>
      `${playlist.name} ${playlist.ownerUserId ?? ""}`.toLowerCase().includes(loweredQuery)
    );
  }, [loweredQuery, playlists]);

  const filteredAlbums = useMemo(() => {
    if (!loweredQuery) return albums;
    return albums.filter((album) =>
      `${album.title} ${album.artist} ${album.year}`.toLowerCase().includes(loweredQuery)
    );
  }, [loweredQuery, albums]);
  const userNameById = useMemo(() => {
    const entries = users.map((user) => [user.id, user.name ?? user.email] as const);
    return new Map(entries);
  }, [users]);
  const totalTracks = useMemo(
    () => albums.reduce((sum, album) => sum + album.trackCount, 0),
    [albums]
  );

  async function handleDeletePlaylist() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setDeletingId(id);
    setError(null);
    try {
      await deletePlaylistAdmin(id);
      setPendingDelete(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreateAlbum(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingAlbum(true);
    setError(null);
    try {
      const payload: AlbumCreatePayload = {
        ...albumForm,
        title: albumForm.title.trim(),
        artist: albumForm.artist.trim(),
        description: albumForm.description?.trim() || null,
        image: albumForm.image?.trim() || null,
      };
      const created = await createAdminAlbum(payload);
      const nextAlbumId = created.id;
      setCreatedAlbumId(nextAlbumId);
      await load();
      setTab("albums");
      setTrackForm({ ...defaultTrackForm, albumId: nextAlbumId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create album");
    } finally {
      setSubmittingAlbum(false);
    }
  }

  async function handleCreateTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingTrack(true);
    setError(null);
    try {
      const payload: AdminTrackCreatePayload = {
        ...trackForm,
        title: trackForm.title.trim(),
        lyrics: trackForm.lyrics?.trim() || null,
        video: trackForm.video?.trim() || null,
      };
      await createAdminTrack(payload);
      setTrackForm((prev) => ({ ...defaultTrackForm, albumId: prev.albumId }));
      await load();
      setTab("albums");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create track");
    } finally {
      setSubmittingTrack(false);
    }
  }

  async function handleCreateTrackForCreatedAlbum() {
    if (!createdAlbumId) return;
    setSubmittingTrack(true);
    setError(null);
    try {
      const payload: AdminTrackCreatePayload = {
        ...trackForm,
        albumId: createdAlbumId,
        title: trackForm.title.trim(),
        lyrics: trackForm.lyrics?.trim() || null,
        video: trackForm.video?.trim() || null,
      };
      await createAdminTrack(payload);
      setTrackForm((prev) => ({ ...defaultTrackForm, albumId: prev.albumId }));
      await load();
      setTab("albums");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create track");
    } finally {
      setSubmittingTrack(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    setDeletingUserId(userId);
    setError(null);
    try {
      await deleteAdminUser(userId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
  }

  async function handleDeleteAlbum(albumId: number) {
    setDeletingAlbumId(albumId);
    setError(null);
    try {
      await deleteAdminAlbum(albumId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete album");
    } finally {
      setDeletingAlbumId(null);
    }
  }

  async function openEditAlbumModal(albumId: number) {
    setIsEditAlbumModalOpen(true);
    setLoadingEditAlbum(true);
    setError(null);
    try {
      const detail = await fetchAdminAlbumDetail(albumId);
      setEditingAlbum(detail);
      setEditAlbumForm({
        title: detail.title,
        artist: detail.artist,
        year: detail.year,
        image: detail.image ?? "",
        description: detail.description ?? "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load album");
      setIsEditAlbumModalOpen(false);
    } finally {
      setLoadingEditAlbum(false);
    }
  }

  async function handleSaveAlbumEdits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAlbum) return;
    setSavingEditAlbum(true);
    setError(null);
    try {
      await updateAdminAlbum(editingAlbum.id, {
        title: editAlbumForm.title.trim(),
        artist: editAlbumForm.artist.trim(),
        year: Number(editAlbumForm.year),
        image: editAlbumForm.image.trim() || null,
        description: editAlbumForm.description.trim() || null,
      });
      const refreshed = await fetchAdminAlbumDetail(editingAlbum.id);
      setEditingAlbum(refreshed);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save album");
    } finally {
      setSavingEditAlbum(false);
    }
  }

  async function handleDeleteTrack(trackId: number, albumId?: number) {
    setDeletingTrackId(trackId);
    setError(null);
    try {
      await deleteAdminTrack(trackId);
      const refreshAlbumId = albumId ?? editingAlbum?.id ?? null;
      if (refreshAlbumId != null) {
        const refreshed = await fetchAdminAlbumDetail(refreshAlbumId);
        setAlbumTracksById((prev) => ({ ...prev, [refreshAlbumId]: refreshed.tracks }));
        if (editingAlbum?.id === refreshAlbumId) {
          setEditingAlbum(refreshed);
        }
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete track");
    } finally {
      setDeletingTrackId(null);
    }
  }

  function openEditTrackModal(track: AdminTrackSummary) {
    setEditingTrack({ ...track });
    setIsEditTrackModalOpen(true);
  }

  async function togglePlaylistExpanded(playlistId: string) {
    if (expandedPlaylistIds.includes(playlistId)) {
      setCollapsingPlaylistIds((prev) =>
        prev.includes(playlistId) ? prev : [...prev, playlistId]
      );
      window.setTimeout(() => {
        setExpandedPlaylistIds((prev) => prev.filter((id) => id !== playlistId));
        setCollapsingPlaylistIds((prev) => prev.filter((id) => id !== playlistId));
      }, 220);
      return;
    }
    setOpeningPlaylistIds((prev) => (prev.includes(playlistId) ? prev : [...prev, playlistId]));
    setExpandedPlaylistIds((prev) => [...prev, playlistId]);
    if (playlistTracksById[playlistId]) {
      window.setTimeout(() => {
        setOpeningPlaylistIds((prev) => prev.filter((id) => id !== playlistId));
      }, 220);
      return;
    }
    setLoadingPlaylistTracksId(playlistId);
    try {
      const detail = await fetchPlaylistDetail(playlistId);
      setPlaylistTracksById((prev) => ({ ...prev, [playlistId]: detail.tracks }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load playlist tracks");
    } finally {
      setLoadingPlaylistTracksId(null);
      window.setTimeout(() => {
        setOpeningPlaylistIds((prev) => prev.filter((id) => id !== playlistId));
      }, 220);
    }
  }

  async function toggleAlbumExpanded(albumId: number) {
    if (expandedAlbumIds.includes(albumId)) {
      setCollapsingAlbumIds((prev) => (prev.includes(albumId) ? prev : [...prev, albumId]));
      window.setTimeout(() => {
        setExpandedAlbumIds((prev) => prev.filter((id) => id !== albumId));
        setCollapsingAlbumIds((prev) => prev.filter((id) => id !== albumId));
      }, 220);
      return;
    }
    setOpeningAlbumIds((prev) => (prev.includes(albumId) ? prev : [...prev, albumId]));
    setExpandedAlbumIds((prev) => [...prev, albumId]);
    if (albumTracksById[albumId]) {
      window.setTimeout(() => {
        setOpeningAlbumIds((prev) => prev.filter((id) => id !== albumId));
      }, 220);
      return;
    }
    setLoadingAlbumTracksId(albumId);
    try {
      const detail = await fetchAdminAlbumDetail(albumId);
      setAlbumTracksById((prev) => ({ ...prev, [albumId]: detail.tracks }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load album tracks");
    } finally {
      setLoadingAlbumTracksId(null);
      window.setTimeout(() => {
        setOpeningAlbumIds((prev) => prev.filter((id) => id !== albumId));
      }, 220);
    }
  }

  async function handleDeletePlaylistTrack(playlistId: string, trackId: number) {
    setDeletingTrackId(trackId);
    setError(null);
    try {
      await removeTrackFromPlaylist(playlistId, trackId);
      const detail = await fetchPlaylistDetail(playlistId);
      setPlaylistTracksById((prev) => ({ ...prev, [playlistId]: detail.tracks }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove track from playlist");
    } finally {
      setDeletingTrackId(null);
    }
  }

  async function handleEditPlaylistTrack(track: PlaylistDetailTrack) {
    setError(null);
    try {
      const detail = await fetchAdminAlbumDetail(track.albumId);
      const fullTrack = detail.tracks.find((t) => t.id === track.trackId);
      if (!fullTrack) {
        throw new Error("Track details not found");
      }
      openEditTrackModal(fullTrack);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open track editor");
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteTarget) return;
    const target = pendingDeleteTarget;
    setConfirmingDelete(true);
    setPendingDeleteTarget(null);
    try {
      if (target.kind === "user") {
        await handleDeleteUser(target.id);
      } else if (target.kind === "album") {
        await handleDeleteAlbum(target.id);
      } else if (target.kind === "playlistTrack") {
        await handleDeletePlaylistTrack(target.playlistId, target.id);
      } else {
        await handleDeleteTrack(target.id, target.albumId);
      }
    } finally {
      setConfirmingDelete(false);
    }
  }

  async function handleSaveTrackEdits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTrack) return;
    setSavingEditTrack(true);
    setError(null);
    try {
      await updateAdminTrack(editingTrack.id, editingTrack);
      if (editingAlbum) {
        const refreshed = await fetchAdminAlbumDetail(editingAlbum.id);
        setEditingAlbum(refreshed);
      }
      await load();
      setIsEditTrackModalOpen(false);
      setEditingTrack(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update track");
    } finally {
      setSavingEditTrack(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="wf-route-page">
        <div className="container p-4 wf-page-shell">
          <p className="wf-loading-dots">Loading</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== "admin") {
    return (
      <div className="wf-route-page">
        <div className="container p-4 wf-page-shell">
          <div className="wf-route-card p-4">
            <p>Access denied.</p>
            <Link href="/">Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wf-route-page wf-route-page--edge-hero">
      <section className="wf-section" aria-labelledby="admin-dashboard-heading">
        <div className="wf-route-hero wf-route-hero--full wf-route-hero--edge">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <h1 id="admin-dashboard-heading" className="h3 mb-1 fw-bold">
                Admin Dashboard
              </h1>
              <p className="mb-0">Manage users, playlists, albums, and tracks.</p>
            </div>
            <div className="wf-admin-tabs" role="tablist" aria-label="Admin sections">
              <button
                type="button"
                className={`wf-admin-tab ${tab === "users" ? "wf-admin-tab--active" : ""}`}
                onClick={() => setTab("users")}
              >
                Users
              </button>
              <button
                type="button"
                className={`wf-admin-tab ${tab === "playlists" ? "wf-admin-tab--active" : ""}`}
                onClick={() => setTab("playlists")}
              >
                Playlists
              </button>
              <button
                type="button"
                className={`wf-admin-tab ${tab === "albums" ? "wf-admin-tab--active" : ""}`}
                onClick={() => setTab("albums")}
              >
                Albums
              </button>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6 col-xl-3">
            <div
              className="wf-route-card wf-admin-stat-card p-3 text-white"
              style={{ background: "linear-gradient(120deg, #ff7a18 0%, #ff4d6d 100%)" }}
            >
              <div className="wf-admin-stat-card-head">
                <span className="wf-admin-stat-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                    <path d="M16 11a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 13a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" />
                    <path d="M2 21v-1a4 4 0 014-4h4a4 4 0 014 4v1" stroke="currentColor" strokeWidth="2" />
                    <path d="M14 21v-1a4 4 0 014-4h0a4 4 0 014 4v1" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
                <p className="wf-admin-stat-label mb-0">Total Users</p>
              </div>
              <p className="wf-admin-stat-value mb-0">{users.length.toLocaleString()}</p>
              <p className="wf-admin-stat-trend mb-0">+6.2% from last week</p>
            </div>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <div
              className="wf-route-card wf-admin-stat-card p-3 text-white"
              style={{ background: "linear-gradient(120deg, #7c3aed 0%, #ec4899 100%)" }}
            >
              <div className="wf-admin-stat-card-head">
                <span className="wf-admin-stat-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                    <path d="M9 18a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" />
                    <path d="M15 16a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 4v11" stroke="currentColor" strokeWidth="2" />
                    <path d="M18 6v8" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
                <p className="wf-admin-stat-label mb-0">Total Playlists</p>
              </div>
              <p className="wf-admin-stat-value mb-0">{playlists.length.toLocaleString()}</p>
              <p className="wf-admin-stat-trend mb-0">+3.8% from last week</p>
            </div>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <div
              className="wf-route-card wf-admin-stat-card p-3 text-white"
              style={{ background: "linear-gradient(120deg, #f59e0b 0%, #fb7185 100%)" }}
            >
              <div className="wf-admin-stat-card-head">
                <span className="wf-admin-stat-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                    <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
                <p className="wf-admin-stat-label mb-0">Total Albums</p>
              </div>
              <p className="wf-admin-stat-value mb-0">{albums.length.toLocaleString()}</p>
              <p className="wf-admin-stat-trend mb-0">+5.1% from last week</p>
            </div>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <div
              className="wf-route-card wf-admin-stat-card p-3 text-white"
              style={{ background: "linear-gradient(120deg, #0ea5e9 0%, #6366f1 100%)" }}
            >
              <div className="wf-admin-stat-card-head">
                <span className="wf-admin-stat-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                    <path d="M7 18a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" />
                    <path d="M13 16a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" />
                    <path d="M10 6l8-2v9" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
                <p className="wf-admin-stat-label mb-0">Total Tracks</p>
              </div>
              <p className="wf-admin-stat-value mb-0">{totalTracks.toLocaleString()}</p>
              <p className="wf-admin-stat-trend mb-0">+2.4% from last week</p>
            </div>
          </div>
        </div>

        <div className="wf-route-card p-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <h2 className="h6 mb-0 text-capitalize">{tab}</h2>
            <input
              type="search"
              className="form-control form-control-sm"
              style={{ maxWidth: 280 }}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search current tab"
              aria-label="Search current tab"
            />
          </div>

          {error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : null}

          {loading ? <p className="wf-loading-dots mb-0">Loading</p> : null}

          {!loading && tab === "users" ? (
            filteredUsers.length === 0 ? (
              <p className="wf-route-empty mb-0">No users found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle wf-admin-data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>User ID</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name ?? "Unknown user"}</td>
                        <td>
                          <code className="small">{user.id}</code>
                        </td>
                        <td>{user.email}</td>
                        <td className="text-capitalize">{user.role}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger wf-route-btn"
                            disabled={deletingUserId === user.id || user.id === session?.user?.id}
                            onClick={() =>
                              setPendingDeleteTarget({
                                kind: "user",
                                id: user.id,
                                    title: "Delete user",
                                    message: `Delete ${
                                      user.name?.trim() || user.email
                                    }? This cannot be undone.`,
                              })
                            }
                          >
                            {deletingUserId === user.id ? "..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : null}

          {!loading && tab === "playlists" ? (
            filteredPlaylists.length === 0 ? (
              <p className="wf-route-empty mb-0">No playlists found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle wf-admin-data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Owner user id</th>
                      <th>Tracks</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlaylists.map((playlist) => (
                      <Fragment key={`playlist-group-${playlist.id}`}>
                        <tr>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-link p-0 text-decoration-none me-2"
                              onClick={() => void togglePlaylistExpanded(playlist.id)}
                              aria-label={`Toggle tracks for ${playlist.name}`}
                            >
                              {expandedPlaylistIds.includes(playlist.id) ? "⌄" : "›"}
                            </button>
                            <Link href={`/library/${playlist.id}`}>{playlist.name}</Link>
                          </td>
                          <td>
                            {playlist.ownerUserId ? (
                              <code className="small">
                                {playlist.ownerUserId}
                                {userNameById.get(playlist.ownerUserId)
                                  ? ` (${userNameById.get(playlist.ownerUserId)})`
                                  : ""}
                              </code>
                            ) : (
                              <code className="small">-</code>
                            )}
                          </td>
                          <td>{playlist.trackCount}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger wf-route-btn"
                              disabled={deletingId === playlist.id}
                              onClick={() => setPendingDelete(playlist)}
                            >
                              {deletingId === playlist.id ? "..." : "Delete"}
                            </button>
                          </td>
                        </tr>
                        {expandedPlaylistIds.includes(playlist.id) ||
                        collapsingPlaylistIds.includes(playlist.id) ? (
                          <tr>
                            <td colSpan={4}>
                              <div
                                className={`ps-4 wf-admin-expand-panel ${
                                  openingPlaylistIds.includes(playlist.id)
                                    ? "is-opening"
                                    : collapsingPlaylistIds.includes(playlist.id)
                                      ? "is-closing"
                                      : "is-open"
                                }`}
                              >
                                {loadingPlaylistTracksId === playlist.id ||
                                openingPlaylistIds.includes(playlist.id) ? (
                                  <p className="small text-muted mb-1">Loading tracks...</p>
                                ) : (playlistTracksById[playlist.id] ?? []).length === 0 ? (
                                  <p className="small text-muted mb-1">No tracks in this playlist.</p>
                                ) : (
                                  <div className="d-grid gap-1">
                                    {(playlistTracksById[playlist.id] ?? []).map((track) => (
                                      <div
                                        key={`${playlist.id}-${track.trackId}`}
                                        className="d-flex justify-content-between align-items-center border rounded px-2 py-1 bg-white"
                                      >
                                        <div className="small">
                                          <span>{track.title}</span>
                                          <span className="text-muted"> - {track.artist}</span>
                                        </div>
                                        <div className="d-flex gap-2">
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary wf-route-btn"
                                            onClick={() => void handleEditPlaylistTrack(track)}
                                          >
                                            Edit
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger wf-route-btn"
                                            disabled={deletingTrackId === track.trackId}
                                            onClick={() =>
                                              setPendingDeleteTarget({
                                                kind: "playlistTrack",
                                                id: track.trackId,
                                                playlistId: playlist.id,
                                                title: "Remove track",
                                                message: "Remove this track from the playlist?",
                                              })
                                            }
                                          >
                                            {deletingTrackId === track.trackId ? "..." : "Delete"}
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : null}

          {!loading && tab === "albums" ? (
            <>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <button
                  type="button"
                  className="wf-admin-action-btn wf-admin-action-btn--primary"
                  onClick={() => {
                    setError(null);
                    setCreatedAlbumId(null);
                    setAlbumForm(defaultAlbumForm);
                    setTrackForm(defaultTrackForm);
                    setIsAlbumModalOpen(true);
                  }}
                >
                  Add Album
                </button>
                <button
                  type="button"
                  className="wf-admin-action-btn wf-admin-action-btn--ghost"
                  onClick={() => {
                    setError(null);
                    setIsTrackModalOpen(true);
                  }}
                >
                  Add Track
                </button>
              </div>
              {filteredAlbums.length === 0 ? (
                <p className="wf-route-empty mb-0">No albums in the database.</p>
              ) : (
                <div className="table-responsive mb-3">
                  <table className="table align-middle wf-admin-data-table">
                    <thead>
                      <tr>
                        <th>Album</th>
                        <th>Artist</th>
                        <th>Year</th>
                        <th>Tracks</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAlbums.map((album) => (
                        <Fragment key={`album-group-${album.id}`}>
                          <tr>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-link p-0 text-decoration-none me-2"
                                onClick={() => void toggleAlbumExpanded(album.id)}
                                aria-label={`Toggle tracks for ${album.title}`}
                              >
                                {expandedAlbumIds.includes(album.id) ? "⌄" : "›"}
                              </button>
                              {album.title}
                            </td>
                            <td>{album.artist}</td>
                            <td>{album.year}</td>
                            <td>{album.trackCount}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary wf-route-btn"
                                  onClick={() => void openEditAlbumModal(album.id)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger wf-route-btn"
                                  disabled={deletingAlbumId === album.id}
                                  onClick={() =>
                                    setPendingDeleteTarget({
                                      kind: "album",
                                      id: album.id,
                                      title: "Delete album",
                                      message: "Delete this album and all of its tracks?",
                                    })
                                  }
                                >
                                  {deletingAlbumId === album.id ? "..." : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedAlbumIds.includes(album.id) ||
                          collapsingAlbumIds.includes(album.id) ? (
                            <tr>
                              <td colSpan={5}>
                                <div
                                  className={`ps-4 wf-admin-expand-panel ${
                                    openingAlbumIds.includes(album.id)
                                      ? "is-opening"
                                      : collapsingAlbumIds.includes(album.id)
                                        ? "is-closing"
                                        : "is-open"
                                  }`}
                                >
                                  {loadingAlbumTracksId === album.id ||
                                  openingAlbumIds.includes(album.id) ? (
                                    <p className="small text-muted mb-1">Loading tracks...</p>
                                  ) : (albumTracksById[album.id] ?? []).length === 0 ? (
                                    <p className="small text-muted mb-1">No tracks in this album.</p>
                                  ) : (
                                    <div className="d-grid gap-1">
                                      {(albumTracksById[album.id] ?? []).map((track) => (
                                        <div
                                          key={`${album.id}-${track.id}`}
                                          className="d-flex justify-content-between align-items-center border rounded px-2 py-1 bg-white"
                                        >
                                          <div className="small">
                                            <span>
                                              {track.number}. {track.title}
                                            </span>
                                          </div>
                                          <div className="d-flex gap-2">
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-outline-secondary wf-route-btn"
                                              onClick={() => openEditTrackModal(track)}
                                            >
                                              Edit
                                            </button>
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-outline-danger wf-route-btn"
                                              disabled={deletingTrackId === track.id}
                                              onClick={() =>
                                                setPendingDeleteTarget({
                                                  kind: "track",
                                                  id: track.id,
                                                  albumId: album.id,
                                                  title: "Delete track",
                                                  message: "Delete this track?",
                                                })
                                              }
                                            >
                                              {deletingTrackId === track.id ? "..." : "Delete"}
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>

      {isAlbumModalOpen ? (
        <div className="wf-route-page wf-modal-route-page">
          <div className="container p-4 wf-page-shell wf-modal-route-shell" style={{ maxWidth: 620 }}>
            <form onSubmit={handleCreateAlbum} className="wf-route-card p-4 wf-modal-route-card">
              <div className="wf-route-hero">
                <h1 className="h3 mb-1">Add album</h1>
                <p className="mb-0">Create an album, then add tracks to it.</p>
              </div>
              <div className="d-grid gap-2 mt-3">
                <input
                  className="form-control"
                  placeholder="Title"
                  value={albumForm.title}
                  onChange={(event) =>
                    setAlbumForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  required
                  autoFocus
                />
                <input
                  className="form-control"
                  placeholder="Artist"
                  value={albumForm.artist}
                  onChange={(event) =>
                    setAlbumForm((prev) => ({ ...prev, artist: event.target.value }))
                  }
                  required
                />
                <input
                  className="form-control"
                  type="number"
                  placeholder="Year"
                  value={albumForm.year}
                  onChange={(event) =>
                    setAlbumForm((prev) => ({ ...prev, year: Number(event.target.value) }))
                  }
                  required
                />
                <input
                  className="form-control"
                  placeholder="Image URL"
                  value={albumForm.image ?? ""}
                  onChange={(event) =>
                    setAlbumForm((prev) => ({ ...prev, image: event.target.value }))
                  }
                />
                <textarea
                  className="form-control"
                  placeholder="Description"
                  value={albumForm.description ?? ""}
                  onChange={(event) =>
                    setAlbumForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              {createdAlbumId ? (
                <div className="border rounded p-3 mt-3">
                  <h2 className="h6 mb-1">Add tracks to this album</h2>
                  <p className="small text-muted mb-3">
                    Album created successfully. New tracks will be linked to album id{" "}
                    <strong>{createdAlbumId}</strong>.
                  </p>
                  <div className="d-grid gap-2">
                    <input
                      className="form-control"
                      type="number"
                      placeholder="Track number"
                      value={trackForm.number}
                      onChange={(event) =>
                        setTrackForm((prev) => ({
                          ...prev,
                          number: Number(event.target.value),
                        }))
                      }
                      required
                    />
                    <input
                      className="form-control"
                      placeholder="Track title"
                      value={trackForm.title}
                      onChange={(event) =>
                        setTrackForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                      required
                    />
                    <input
                      className="form-control"
                      placeholder="Video URL"
                      value={trackForm.video ?? ""}
                      onChange={(event) =>
                        setTrackForm((prev) => ({ ...prev, video: event.target.value }))
                      }
                    />
                    <textarea
                      className="form-control"
                      placeholder="Lyrics"
                      value={trackForm.lyrics ?? ""}
                      onChange={(event) =>
                        setTrackForm((prev) => ({ ...prev, lyrics: event.target.value }))
                      }
                    />
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="wf-admin-action-btn wf-admin-action-btn--primary"
                        disabled={submittingTrack}
                        onClick={() => void handleCreateTrackForCreatedAlbum()}
                      >
                        {submittingTrack ? "Adding..." : "Add track"}
                      </button>
                      <button
                        type="button"
                        className="wf-admin-action-btn wf-admin-action-btn--ghost"
                        onClick={() => setTrackForm({ ...defaultTrackForm, albumId: createdAlbumId })}
                      >
                        Reset track form
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
              {error ? (
                <div className="alert alert-danger mt-3 mb-0" role="alert">
                  {error}
                </div>
              ) : null}
              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="submit"
                  className="wf-admin-action-btn wf-admin-action-btn--primary"
                  disabled={submittingAlbum || createdAlbumId != null}
                >
                  {submittingAlbum ? "Creating..." : createdAlbumId ? "Album created" : "Create album"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary wf-route-btn"
                  onClick={() => {
                    setIsAlbumModalOpen(false);
                    setCreatedAlbumId(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isTrackModalOpen ? (
        <div className="wf-route-page wf-modal-route-page">
          <div className="container p-4 wf-page-shell wf-modal-route-shell" style={{ maxWidth: 620 }}>
            <form onSubmit={handleCreateTrack} className="wf-route-card p-4 wf-modal-route-card">
              <div className="wf-route-hero">
                <h1 className="h3 mb-1">Add track</h1>
                <p className="mb-0">Select an album and add a new track.</p>
              </div>
              <div className="d-grid gap-2 mt-3">
                <label htmlFor="admin-track-album-select" className="form-label mb-1 fw-semibold">
                  Album
                </label>
                <select
                  id="admin-track-album-select"
                  className="form-select"
                  value={trackForm.albumId}
                  onChange={(event) =>
                    setTrackForm((prev) => ({
                      ...prev,
                      albumId: Number(event.target.value),
                    }))
                  }
                  required
                >
                  <option value={0} disabled>
                    Select album
                  </option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.title} - {album.artist}
                    </option>
                  ))}
                </select>
                <hr className="my-2" />
                <input
                  className="form-control"
                  type="number"
                  placeholder="Track number"
                  value={trackForm.number}
                  onChange={(event) =>
                    setTrackForm((prev) => ({ ...prev, number: Number(event.target.value) }))
                  }
                  required
                />
                <input
                  className="form-control"
                  placeholder="Track title"
                  value={trackForm.title}
                  onChange={(event) =>
                    setTrackForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  required
                  autoFocus
                />
                <input
                  className="form-control"
                  placeholder="Video URL"
                  value={trackForm.video ?? ""}
                  onChange={(event) =>
                    setTrackForm((prev) => ({ ...prev, video: event.target.value }))
                  }
                />
                <textarea
                  className="form-control"
                  placeholder="Lyrics"
                  value={trackForm.lyrics ?? ""}
                  onChange={(event) =>
                    setTrackForm((prev) => ({ ...prev, lyrics: event.target.value }))
                  }
                />
              </div>
              {error ? (
                <div className="alert alert-danger mt-3 mb-0" role="alert">
                  {error}
                </div>
              ) : null}
              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="submit"
                  className="wf-admin-action-btn wf-admin-action-btn--primary"
                  disabled={submittingTrack || albums.length === 0}
                >
                  {submittingTrack ? "Creating..." : "Create track"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary wf-route-btn"
                  onClick={() => setIsTrackModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isEditAlbumModalOpen ? (
        <div className="wf-route-page wf-modal-route-page">
          <div className="container p-4 wf-page-shell wf-modal-route-shell" style={{ maxWidth: 760 }}>
            {loadingEditAlbum || !editingAlbum ? (
              <div className="wf-route-card p-4 wf-modal-route-card">
                <p className="wf-loading-dots mb-0">Loading album</p>
              </div>
            ) : (
              <form onSubmit={handleSaveAlbumEdits} className="wf-route-card p-4 wf-modal-route-card">
                <div className="wf-route-hero">
                  <h1 className="h3 mb-1">Edit album</h1>
                  <p className="mb-0">Update album details and manage individual tracks.</p>
                </div>

                <div className="row g-2 mt-2">
                  <div className="col-12 col-md-6">
                    <input
                      className="form-control"
                      placeholder="Title"
                      value={editAlbumForm.title}
                      onChange={(event) =>
                        setEditAlbumForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <input
                      className="form-control"
                      placeholder="Artist"
                      value={editAlbumForm.artist}
                      onChange={(event) =>
                        setEditAlbumForm((prev) => ({ ...prev, artist: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <input
                      className="form-control"
                      type="number"
                      placeholder="Year"
                      value={editAlbumForm.year}
                      onChange={(event) =>
                        setEditAlbumForm((prev) => ({ ...prev, year: Number(event.target.value) }))
                      }
                      required
                    />
                  </div>
                  <div className="col-12 col-md-8">
                    <input
                      className="form-control"
                      placeholder="Image URL"
                      value={editAlbumForm.image}
                      onChange={(event) =>
                        setEditAlbumForm((prev) => ({ ...prev, image: event.target.value }))
                      }
                    />
                  </div>
                  <div className="col-12">
                    <textarea
                      className="form-control"
                      placeholder="Description"
                      value={editAlbumForm.description}
                      onChange={(event) =>
                        setEditAlbumForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="d-flex gap-2 mt-3">
                  <button
                    type="submit"
                    className="wf-admin-action-btn wf-admin-action-btn--primary"
                    disabled={savingEditAlbum}
                  >
                    {savingEditAlbum ? "Saving..." : "Save album"}
                  </button>
                </div>

                <hr className="my-4" />
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h2 className="h6 mb-0">Tracks</h2>
                  <button
                    type="button"
                    className="wf-admin-action-btn wf-admin-action-btn--ghost"
                    onClick={() => {
                      setTrackForm({
                        ...defaultTrackForm,
                        albumId: editingAlbum.id,
                      });
                      setIsTrackModalOpen(true);
                    }}
                  >
                    Add Track
                  </button>
                </div>
                {editingAlbum.tracks.length === 0 ? (
                  <p className="small text-muted mb-0">No tracks for this album yet.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle wf-admin-data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Title</th>
                          <th aria-label="Actions" />
                        </tr>
                      </thead>
                      <tbody>
                        {editingAlbum.tracks.map((track) => (
                          <tr key={track.id}>
                            <td>{track.number}</td>
                            <td>{track.title}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary wf-route-btn"
                                  onClick={() => openEditTrackModal(track)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger wf-route-btn"
                                  disabled={deletingTrackId === track.id}
                                  onClick={() =>
                                    setPendingDeleteTarget({
                                      kind: "track",
                                      id: track.id,
                                      albumId: editingAlbum.id,
                                      title: "Delete track",
                                      message: "Delete this track?",
                                    })
                                  }
                                >
                                  {deletingTrackId === track.id ? "..." : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {error ? (
                  <div className="alert alert-danger mt-3 mb-0" role="alert">
                    {error}
                  </div>
                ) : null}
                <div className="d-flex gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary wf-route-btn"
                    onClick={() => {
                      setIsEditAlbumModalOpen(false);
                      setEditingAlbum(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {isEditTrackModalOpen && editingTrack ? (
        <div className="wf-route-page wf-modal-route-page">
          <div className="container p-4 wf-page-shell wf-modal-route-shell" style={{ maxWidth: 620 }}>
            <form onSubmit={handleSaveTrackEdits} className="wf-route-card p-4 wf-modal-route-card">
              <div className="wf-route-hero">
                <h1 className="h3 mb-1">Edit track</h1>
                <p className="mb-0">Update track details or move it to another album.</p>
              </div>
              <div className="d-grid gap-2 mt-3">
                <label htmlFor="admin-edit-track-album" className="form-label mb-1 fw-semibold">
                  Album
                </label>
                <select
                  id="admin-edit-track-album"
                  className="form-select"
                  value={editingTrack.albumId}
                  onChange={(event) =>
                    setEditingTrack((prev) =>
                      prev ? { ...prev, albumId: Number(event.target.value) } : prev
                    )
                  }
                  required
                >
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.title} - {album.artist}
                    </option>
                  ))}
                </select>
                <hr className="my-2" />
                <input
                  className="form-control"
                  type="number"
                  placeholder="Track number"
                  value={editingTrack.number}
                  onChange={(event) =>
                    setEditingTrack((prev) =>
                      prev ? { ...prev, number: Number(event.target.value) } : prev
                    )
                  }
                  required
                />
                <input
                  className="form-control"
                  placeholder="Track title"
                  value={editingTrack.title}
                  onChange={(event) =>
                    setEditingTrack((prev) =>
                      prev ? { ...prev, title: event.target.value } : prev
                    )
                  }
                  required
                  autoFocus
                />
                <input
                  className="form-control"
                  placeholder="Video URL"
                  value={editingTrack.video ?? ""}
                  onChange={(event) =>
                    setEditingTrack((prev) =>
                      prev ? { ...prev, video: event.target.value } : prev
                    )
                  }
                />
                <textarea
                  className="form-control"
                  placeholder="Lyrics"
                  value={editingTrack.lyrics ?? ""}
                  onChange={(event) =>
                    setEditingTrack((prev) =>
                      prev ? { ...prev, lyrics: event.target.value } : prev
                    )
                  }
                />
              </div>
              {error ? (
                <div className="alert alert-danger mt-3 mb-0" role="alert">
                  {error}
                </div>
              ) : null}
              <div className="d-flex gap-2 mt-3">
                <button
                  type="submit"
                  className="wf-admin-action-btn wf-admin-action-btn--primary"
                  disabled={savingEditTrack}
                >
                  {savingEditTrack ? "Saving..." : "Save track"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary wf-route-btn"
                  onClick={() => {
                    setIsEditTrackModalOpen(false);
                    setEditingTrack(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {pendingDeleteTarget ? (
        <div
          className="wf-modal-route-page"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 6000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            className="wf-modal-route-shell"
            style={{
              width: "min(520px, calc(100vw - 2rem))",
              maxHeight: "calc(100dvh - 2rem)",
              padding: 0,
              margin: 0,
            }}
          >
            <div className="wf-route-card p-4 wf-modal-route-card">
              <div className="wf-route-hero">
                <h1 className="h4 mb-1">{pendingDeleteTarget.title}</h1>
                <p className="mb-0">{pendingDeleteTarget.message}</p>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary wf-route-btn"
                  onClick={() => setPendingDeleteTarget(null)}
                  disabled={confirmingDelete}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger wf-route-btn"
                  onClick={() => void handleConfirmDelete()}
                  disabled={confirmingDelete}
                >
                  {confirmingDelete ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <DeletePlaylistModal
          playlistName={pendingDelete.name}
          isDeleting={deletingId === pendingDelete.id}
          error={error}
          onCancel={() => {
            if (deletingId) return;
            setPendingDelete(null);
          }}
          onConfirm={() => void handleDeletePlaylist()}
        />
      ) : null}
    </div>
  );
}
