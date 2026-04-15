import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requirePlaylistOwnerIfSet } from "@/lib/playlist-access";
import { isValidUuid } from "@/lib/uuid";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; trackId: string }> }
) {
  const { id: playlistId, trackId: trackIdParam } = await context.params;

  if (!isValidUuid(playlistId)) {
    return NextResponse.json({ error: "Invalid playlist id" }, { status: 400 });
  }

  const trackId = parseInt(trackIdParam, 10);
  if (Number.isNaN(trackId)) {
    return NextResponse.json({ error: "Invalid trackId" }, { status: 400 });
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

    const del = await client.query(
      `DELETE FROM playlist_tracks
       WHERE playlist_id = $1::uuid AND track_id = $2`,
      [playlistId, trackId]
    );
    await client.query("COMMIT");

    if (del.rowCount === 0) {
      return NextResponse.json(
        { error: "Track not in playlist" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("DELETE /api/playlists/[id]/tracks/[trackId] error:", err);
    return NextResponse.json(
      { error: "Failed to remove track from playlist" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
