import type { PoolClient } from "pg";
import { NextResponse } from "next/server";

interface PlaylistOwnerRow {
  owner_user_id: string | null;
}

/**
 * When a playlist has an owner, mutations require matching X-Owner-User-Id.
 * Playlists with null owner remain open for Milestone 4 demos.
 */
export async function requirePlaylistOwnerIfSet(
  client: PoolClient,
  playlistId: string,
  headerOwnerId: string | null
): Promise<NextResponse | null> {
  const res = await client.query<PlaylistOwnerRow>(
    "SELECT owner_user_id FROM playlists WHERE id = $1::uuid",
    [playlistId]
  );
  const row = res.rows[0];
  if (!row) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }
  if (row.owner_user_id == null) {
    return null;
  }
  const header = headerOwnerId?.toLowerCase() ?? "";
  const owner = row.owner_user_id.toLowerCase();
  if (!header || header !== owner) {
    return NextResponse.json(
      { error: "Forbidden: playlist is owned by another user" },
      { status: 403 }
    );
  }
  return null;
}
