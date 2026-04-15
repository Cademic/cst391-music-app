import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import type { Album, Track } from "@/lib/types";

export const runtime = "nodejs";

interface AlbumRow {
  id: number;
  title: string;
  artist: string;
  year: number;
  image: string | null;
  description: string | null;
}

interface TrackRow {
  id: number;
  album_id: number;
  title: string;
  number: number;
  lyrics: string | null;
  video_url: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id") ?? url.searchParams.get("albumId");
    let albumsData: AlbumRow[];

    if (idParam) {
      const idNum = parseInt(idParam, 10);
      if (Number.isNaN(idNum)) {
        return NextResponse.json(
          { error: "Invalid id query parameter" },
          { status: 400 }
        );
      }
      const res = await getPool().query<AlbumRow>(
        "SELECT * FROM albums WHERE id = $1",
        [idNum]
      );
      albumsData = res.rows;
    } else {
      const res = await getPool().query<AlbumRow>("SELECT * FROM albums");
      albumsData = res.rows;
    }

    if (albumsData.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const albumIds = albumsData.map((a) => a.id);
    const tracksRes = await getPool().query<TrackRow>(
      "SELECT * FROM tracks WHERE album_id = ANY($1) ORDER BY number",
      [albumIds]
    );
    const tracksData = tracksRes.rows;

    const tracksByAlbum: Record<number, Track[]> = {};
    for (const track of tracksData) {
      (tracksByAlbum[track.album_id] ??= []).push({
        id: track.id,
        number: track.number,
        title: track.title,
        lyrics: track.lyrics,
        video: track.video_url,
      });
    }

    const albumsWithTracks: Album[] = albumsData.map((album) => ({
      id: album.id,
      title: album.title,
      artist: album.artist,
      year: album.year,
      image: album.image,
      description: album.description,
      tracks: tracksByAlbum[album.id] ?? [],
    }));

    return NextResponse.json(albumsWithTracks);
  } catch (error) {
    console.error("GET /api/albums error:", error);
    return NextResponse.json(
      { error: "Failed to fetch albums" },
      { status: 500 }
    );
  }
}

function parseYear(
  year: unknown
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (year === "" || year == null) return { ok: true, value: null };
  const n = typeof year === "string" ? Number(year) : Number(year);
  if (Number.isNaN(n)) return { ok: false, error: "year must be a number" };
  return { ok: true, value: n };
}

export async function POST(request: NextRequest) {
  try {
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
      const albumId: number = albumRes.rows[0].id;

      if (Array.isArray(tracks)) {
        for (const t of tracks as Track[]) {
          if (t.title == null) continue;
          const titleTrim = String(t.title).trim();
          if (!titleTrim) continue;
          const rawNum = (t as { number?: unknown }).number;
          let num: number | null =
            rawNum === "" || rawNum == null ? null : Number(rawNum);
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
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("POST /api/albums transaction error:", err);
      return NextResponse.json(
        { error: "Error creating album" },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const idRaw = body?.id ?? body?.albumId;
    const albumId =
      idRaw === "" || idRaw == null ? NaN : Number(idRaw);
    if (Number.isNaN(albumId)) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { title, artist, year, description, image, tracks } = body;
    const titleStr = typeof title === "string" ? title.trim() : "";
    const artistStr = typeof artist === "string" ? artist.trim() : "";
    if (!titleStr || !artistStr) {
      return NextResponse.json(
        { error: "title and artist are required" },
        { status: 400 }
      );
    }

    const yearParsed = parseYear(year);
    if (!yearParsed.ok) {
      return NextResponse.json({ error: yearParsed.error }, { status: 400 });
    }
    if (yearParsed.value == null) {
      return NextResponse.json(
        { error: "year is required for update" },
        { status: 400 }
      );
    }

    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const updateRes = await client.query(
        `UPDATE albums
         SET title = $1, artist = $2, description = $3, year = $4, image = $5
         WHERE id = $6`,
        [
          titleStr,
          artistStr,
          description ?? null,
          yearParsed.value,
          image ?? null,
          albumId,
        ]
      );
      if (updateRes.rowCount === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Album not found" }, { status: 404 });
      }

      await client.query("DELETE FROM tracks WHERE album_id = $1", [albumId]);

      if (Array.isArray(tracks)) {
        for (const t of tracks as Track[]) {
          if (t.title == null) continue;
          const titleTrim = String(t.title).trim();
          if (!titleTrim) continue;
          const rawNum = (t as { number?: unknown }).number;
          let num: number | null =
            rawNum === "" || rawNum == null ? null : Number(rawNum);
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
      return NextResponse.json({ id: albumId }, { status: 200 });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("PUT /api/albums transaction error:", err);
      return NextResponse.json(
        { error: "Error updating album" },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
