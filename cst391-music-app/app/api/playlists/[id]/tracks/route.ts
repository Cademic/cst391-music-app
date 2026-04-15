import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requirePlaylistOwnerIfSet } from "@/lib/playlist-access";
import { isValidUuid } from "@/lib/uuid";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: playlistId } = await context.params;

  if (!isValidUuid(playlistId)) {
    return NextResponse.json({ error: "Invalid playlist id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const trackId = (body as { trackId?: unknown }).trackId;
  if (trackId == null || typeof trackId !== "number" || !Number.isInteger(trackId)) {
    return NextResponse.json(
      { error: "Missing or invalid trackId (integer)" },
      { status: 400 }
    );
  }

  const headerOwner = request.headers.get("X-Owner-User-Id");

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");

    const denied = await requirePlaylistOwnerIfSet(
      client,
      playlistId,
      headerOwner
    );
    if (denied) {
      await client.query("ROLLBACK");
      return denied;
    }

    const trackCheck = await client.query<{ id: number }>(
      "SELECT id FROM tracks WHERE id = $1",
      [trackId]
    );
    if (trackCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    await client.query(
      `INSERT INTO playlist_tracks (playlist_id, track_id)
       VALUES ($1::uuid, $2)`,
      [playlistId, trackId]
    );
    await client.query("COMMIT");
    return NextResponse.json(
      { playlistId, trackId },
      { status: 201 }
    );
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    const code = (err as { code?: string })?.code;
    if (code === "23505") {
      return NextResponse.json(
        { error: "Track already in playlist" },
        { status: 409 }
      );
    }
    console.error("POST /api/playlists/[id]/tracks error:", err);
    return NextResponse.json(
      { error: "Failed to add track to playlist" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
