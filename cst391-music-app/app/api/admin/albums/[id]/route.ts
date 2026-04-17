import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

interface AlbumRow {
  id: number;
  title: string;
  artist: string;
  year: number;
  image: string | null;
  description: string | null;
  release_mbid: string | null;
}

interface TrackRow {
  id: number;
  album_id: number;
  title: string;
  number: number;
  lyrics: string | null;
  video_url: string | null;
  recording_mbid: string | null;
}

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

function parseAlbumId(value: string): number {
  const id = Number(value);
  return Number.isNaN(id) ? NaN : id;
}

function parseYear(
  year: unknown
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (year === "" || year == null) return { ok: true, value: null };
  const n = typeof year === "string" ? Number(year) : Number(year);
  if (Number.isNaN(n)) return { ok: false, error: "year must be a number" };
  return { ok: true, value: n };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { id } = await context.params;
    const albumId = parseAlbumId(id);
    if (Number.isNaN(albumId)) {
      return NextResponse.json({ error: "Invalid album id" }, { status: 400 });
    }

    const albumRes = await getPool().query<AlbumRow>(
      `SELECT id, title, artist, year, image, description, release_mbid
       FROM albums
       WHERE id = $1`,
      [albumId]
    );
    const album = albumRes.rows[0];
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const tracksRes = await getPool().query<TrackRow>(
      `SELECT id, album_id, title, number, lyrics, video_url, recording_mbid
       FROM tracks
       WHERE album_id = $1
       ORDER BY number ASC, id ASC`,
      [albumId]
    );

    return NextResponse.json({
      id: album.id,
      title: album.title,
      artist: album.artist,
      year: album.year,
      image: album.image,
      description: album.description,
      releaseMbid: album.release_mbid,
      tracks: tracksRes.rows.map((t) => ({
        id: t.id,
        albumId: t.album_id,
        title: t.title,
        number: t.number,
        lyrics: t.lyrics,
        video: t.video_url,
        recordingMbid: t.recording_mbid,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/albums/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch album" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { id } = await context.params;
    const albumId = parseAlbumId(id);
    if (Number.isNaN(albumId)) {
      return NextResponse.json({ error: "Invalid album id" }, { status: 400 });
    }

    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const artist = typeof body?.artist === "string" ? body.artist.trim() : "";
    const image = typeof body?.image === "string" ? body.image.trim() : null;
    const description = typeof body?.description === "string" ? body.description.trim() : null;
    if (!title || !artist) {
      return NextResponse.json({ error: "title and artist are required" }, { status: 400 });
    }
    const yearParsed = parseYear(body?.year);
    if (!yearParsed.ok || yearParsed.value == null) {
      return NextResponse.json(
        { error: yearParsed.ok ? "year is required" : yearParsed.error },
        { status: 400 }
      );
    }

    const result = await getPool().query(
      `UPDATE albums
       SET title = $1, artist = $2, year = $3, image = $4, description = $5
       WHERE id = $6`,
      [title, artist, yearParsed.value, image || null, description || null, albumId]
    );
    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }
    return NextResponse.json({ id: albumId });
  } catch (error) {
    console.error("PATCH /api/admin/albums/[id] error:", error);
    return NextResponse.json({ error: "Failed to update album" }, { status: 500 });
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
    const albumId = parseAlbumId(id);
    if (Number.isNaN(albumId)) {
      return NextResponse.json({ error: "Invalid album id" }, { status: 400 });
    }

    const result = await getPool().query("DELETE FROM albums WHERE id = $1", [albumId]);
    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/admin/albums/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete album" }, { status: 500 });
  }
}
