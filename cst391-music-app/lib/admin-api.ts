import type {
  AdminAlbumDetail,
  AdminAlbumSummary,
  AdminTrackCreatePayload,
  AdminTrackSummary,
  AdminUserSummary,
  AlbumCreatePayload,
} from "@/lib/types";

async function parseJson<T>(res: Response): Promise<T> {
  const json: unknown = await res.json();
  return json as T;
}

async function readApiErrorMessage(res: Response): Promise<string | undefined> {
  try {
    const json: unknown = await res.json();
    if (
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
    ) {
      return (json as { error: string }).error;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export async function fetchAdminUsers(): Promise<AdminUserSummary[]> {
  const res = await fetch("/api/admin/users", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = (await readApiErrorMessage(res)) ?? `Failed to load users (${res.status})`;
    throw new Error(msg);
  }
  return parseJson<AdminUserSummary[]>(res);
}

export async function deleteAdminUser(userId: string): Promise<void> {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const msg = (await readApiErrorMessage(res)) ?? `Failed to delete user (${res.status})`;
    throw new Error(msg);
  }
}

export async function fetchAdminAlbums(): Promise<AdminAlbumSummary[]> {
  const res = await fetch("/api/admin/albums", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = (await readApiErrorMessage(res)) ?? `Failed to load albums (${res.status})`;
    throw new Error(msg);
  }
  return parseJson<AdminAlbumSummary[]>(res);
}

export async function createAdminAlbum(body: AlbumCreatePayload): Promise<{ id: number }> {
  const res = await fetch("/api/admin/albums", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = (await readApiErrorMessage(res)) ?? `Failed to create album (${res.status})`;
    throw new Error(msg);
  }
  return parseJson<{ id: number }>(res);
}

export async function createAdminTrack(
  body: AdminTrackCreatePayload
): Promise<{ id: number }> {
  const res = await fetch("/api/admin/tracks", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = (await readApiErrorMessage(res)) ?? `Failed to create track (${res.status})`;
    throw new Error(msg);
  }
  return parseJson<{ id: number }>(res);
}

export async function fetchAdminAlbumDetail(albumId: number): Promise<AdminAlbumDetail> {
  const res = await fetch(`/api/admin/albums/${albumId}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = (await readApiErrorMessage(res)) ?? `Failed to load album (${res.status})`;
    throw new Error(msg);
  }
  return parseJson<AdminAlbumDetail>(res);
}

export async function updateAdminAlbum(
  albumId: number,
  body: {
    title: string;
    artist: string;
    year: number;
    image?: string | null;
    description?: string | null;
  }
): Promise<{ id: number }> {
  const res = await fetch(`/api/admin/albums/${albumId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = (await readApiErrorMessage(res)) ?? `Failed to update album (${res.status})`;
    throw new Error(msg);
  }
  return parseJson<{ id: number }>(res);
}

export async function deleteAdminAlbum(albumId: number): Promise<void> {
  const res = await fetch(`/api/admin/albums/${albumId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const msg = (await readApiErrorMessage(res)) ?? `Failed to delete album (${res.status})`;
    throw new Error(msg);
  }
}

export async function updateAdminTrack(
  trackId: number,
  body: AdminTrackSummary
): Promise<{ id: number }> {
  const res = await fetch(`/api/admin/tracks/${trackId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = (await readApiErrorMessage(res)) ?? `Failed to update track (${res.status})`;
    throw new Error(msg);
  }
  return parseJson<{ id: number }>(res);
}

export async function deleteAdminTrack(trackId: number): Promise<void> {
  const res = await fetch(`/api/admin/tracks/${trackId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const msg = (await readApiErrorMessage(res)) ?? `Failed to delete track (${res.status})`;
    throw new Error(msg);
  }
}
