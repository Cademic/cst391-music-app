import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isValidUuid } from "@/lib/uuid";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: playlistId } = await context.params;

  if (!isValidUuid(playlistId)) {
    return NextResponse.json({ error: "Invalid playlist id" }, { status: 400 });
  }

  try {
    const result = await getPool().query(
      "DELETE FROM playlists WHERE id = $1::uuid RETURNING id",
      [playlistId]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/admin/playlists/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete playlist" },
      { status: 500 }
    );
  }
}
