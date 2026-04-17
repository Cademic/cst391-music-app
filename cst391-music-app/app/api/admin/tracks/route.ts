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

export async function POST(request: NextRequest) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const body = await request.json();
    const albumIdRaw = body?.albumId;
    const numberRaw = body?.number;
    const titleRaw = body?.title;
    const lyricsRaw = body?.lyrics;
    const videoRaw = body?.video;

    const albumId = Number(albumIdRaw);
    if (Number.isNaN(albumId)) {
      return NextResponse.json({ error: "albumId is required" }, { status: 400 });
    }

    const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    let trackNumber = Number(numberRaw);
    if (numberRaw == null || numberRaw === "") {
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

    const result = await getPool().query<{ id: number }>(
      `INSERT INTO tracks (album_id, title, number, lyrics, video_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        albumId,
        title,
        Math.floor(trackNumber),
        typeof lyricsRaw === "string" && lyricsRaw.trim() ? lyricsRaw : null,
        typeof videoRaw === "string" && videoRaw.trim() ? videoRaw : null,
      ]
    );
    const trackId = result.rows[0]?.id;
    if (!trackId) {
      return NextResponse.json({ error: "Error creating track" }, { status: 500 });
    }
    return NextResponse.json({ id: trackId }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/tracks error:", error);
    return NextResponse.json({ error: "Failed to create track" }, { status: 500 });
  }
}
