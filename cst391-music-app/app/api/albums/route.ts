import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
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
    const albumIdParam = url.searchParams.get("albumId");
    let albumsData: AlbumRow[];

    if (albumIdParam) {
      const idNum = parseInt(albumIdParam, 10);
      if (Number.isNaN(idNum)) {
        return NextResponse.json(
          { error: "Invalid albumId parameter" },
          { status: 400 }
        );
      }
      const res = await pool.query<AlbumRow>(
        "SELECT * FROM albums WHERE id = $1",
        [idNum]
      );
      albumsData = res.rows;
    } else {
      const res = await pool.query<AlbumRow>("SELECT * FROM albums");
      albumsData = res.rows;
    }

    if (albumsData.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const albumIds = albumsData.map((a) => a.id);
    const tracksRes = await pool.query<TrackRow>(
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, artist, year, description, image, tracks } = body;
    if (!title || !artist || year == null) {
      return NextResponse.json(
        { error: "Missing required album fields (title, artist, year)" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const albumRes = await client.query<{ id: number }>(
        `INSERT INTO albums (title, artist, description, year, image)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [title, artist, description ?? null, year, image ?? null]
      );
      const albumId: number = albumRes.rows[0].id;

      if (Array.isArray(tracks)) {
        for (const t of tracks as Track[]) {
          if (t.title == null || t.number == null) continue;
          await client.query(
            `INSERT INTO tracks (album_id, title, number, lyrics, video_url)
             VALUES ($1, $2, $3, $4, $5)`,
            [albumId, t.title, t.number, t.lyrics ?? null, t.video ?? null]
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
