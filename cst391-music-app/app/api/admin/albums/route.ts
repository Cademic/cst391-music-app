import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool } from "@/lib/db";
import type { Track } from "@/lib/types";

export const runtime = "nodejs";

interface AdminAlbumRow {
  id: number;
  title: string;
  artist: string;
  year: number;
  image: string | null;
  description: string | null;
  release_mbid: string | null;
  track_count: number;
}

function parseYear(
  year: unknown
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (year === "" || year == null) return { ok: true, value: null };
  const n = typeof year === "string" ? Number(year) : Number(year);
  if (Number.isNaN(n)) return { ok: false, error: "year must be a number" };
  return { ok: true, value: n };
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

export async function GET() {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const result = await getPool().query<AdminAlbumRow>(
      `SELECT a.id, a.title, a.artist, a.year, a.image, a.description, a.release_mbid,
              COUNT(t.id)::int AS track_count
       FROM albums a
       LEFT JOIN tracks t ON t.album_id = a.id
       GROUP BY a.id
       ORDER BY a.year DESC, a.title ASC`
    );

    return NextResponse.json(
      result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        artist: row.artist,
        year: row.year,
        image: row.image,
        description: row.description,
        releaseMbid: row.release_mbid,
        trackCount: row.track_count,
      }))
    );
  } catch (error) {
    console.error("GET /api/admin/albums error:", error);
    return NextResponse.json({ error: "Failed to fetch albums" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const body = await request.json();
    const { title, artist, year, description, image, tracks } = body;
    const titleStr = typeof title === "string" ? title.trim() : "";
    const artistStr = typeof artist === "string" ? artist.trim() : "";
    if (!titleStr || !artistStr) {
      return NextResponse.json(
        { error: "Missing required album fields (title, artist)" },
        { status: 400 }
      );
    }

    const yearParsed = parseYear(year);
    if (!yearParsed.ok) {
      return NextResponse.json({ error: yearParsed.error }, { status: 400 });
    }
    if (yearParsed.value == null) {
      return NextResponse.json(
        { error: "Missing required album field (year)" },
        { status: 400 }
      );
    }

    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const albumRes = await client.query<{ id: number }>(
        `INSERT INTO albums (title, artist, description, year, image)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [titleStr, artistStr, description ?? null, yearParsed.value, image ?? null]
      );
      const albumId = albumRes.rows[0]?.id;
      if (!albumId) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Error creating album" }, { status: 500 });
      }

      if (Array.isArray(tracks)) {
        for (const t of tracks as Track[]) {
          if (t.title == null) continue;
          const titleTrim = String(t.title).trim();
          if (!titleTrim) continue;
          const rawNum = (t as { number?: unknown }).number;
          let num: number | null = rawNum === "" || rawNum == null ? null : Number(rawNum);
          if (num != null && Number.isNaN(num)) {
            await client.query("ROLLBACK");
            return NextResponse.json(
              { error: "track.number must be a number" },
              { status: 400 }
            );
          }
          if (num == null) num = 0;
          await client.query(
            `INSERT INTO tracks (album_id, title, number, lyrics, video_url)
             VALUES ($1, $2, $3, $4, $5)`,
            [albumId, titleTrim, num, t.lyrics ?? null, t.video ?? null]
          );
        }
      }

      await client.query("COMMIT");
      return NextResponse.json({ id: albumId }, { status: 201 });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("POST /api/admin/albums transaction error:", error);
      return NextResponse.json({ error: "Error creating album" }, { status: 500 });
    } finally {
      client.release();
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
