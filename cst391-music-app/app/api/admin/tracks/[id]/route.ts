import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }
  if (session.user.role !== "admin") {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }
  return { ok: true as const };
}

function parseTrackId(value: string): number {
  const id = Number(value);
  return Number.isNaN(id) ? NaN : id;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { id } = await context.params;
    const trackId = parseTrackId(id);
    if (Number.isNaN(trackId)) {
      return NextResponse.json({ error: "Invalid track id" }, { status: 400 });
    }

    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const albumId = Number(body?.albumId);
    let trackNumber = Number(body?.number);
    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
    if (Number.isNaN(albumId)) {
      return NextResponse.json({ error: "albumId is required" }, { status: 400 });
    }
    if (body?.number == null || body?.number === "") {
      trackNumber = 0;
    }
    if (Number.isNaN(trackNumber)) {
      return NextResponse.json({ error: "number must be a number" }, { status: 400 });
    }

    const albumExists = await getPool().query<{ id: number }>(
      "SELECT id FROM albums WHERE id = $1 LIMIT 1",
      [albumId]
    );
    if (albumExists.rows.length === 0) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const result = await getPool().query(
      `UPDATE tracks
       SET album_id = $1, title = $2, number = $3, lyrics = $4, video_url = $5
       WHERE id = $6`,
      [
        albumId,
        title,
        Math.floor(trackNumber),
        typeof body?.lyrics === "string" && body.lyrics.trim() ? body.lyrics : null,
        typeof body?.video === "string" && body.video.trim() ? body.video : null,
        trackId,
      ]
    );
    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }
    return NextResponse.json({ id: trackId });
  } catch (error) {
    console.error("PATCH /api/admin/tracks/[id] error:", error);
    return NextResponse.json({ error: "Failed to update track" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { id } = await context.params;
    const trackId = parseTrackId(id);
    if (Number.isNaN(trackId)) {
      return NextResponse.json({ error: "Invalid track id" }, { status: 400 });
    }

    const result = await getPool().query("DELETE FROM tracks WHERE id = $1", [trackId]);
    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/admin/tracks/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete track" }, { status: 500 });
  }
}
