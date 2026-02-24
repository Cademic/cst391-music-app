import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { Album, Track } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const pool = getPool();
    const url = new URL(request.url);
    const albumIdParam = url.searchParams.get('albumId');
    let albumsData: Album[];

    if (albumIdParam) {
      const idNum = parseInt(albumIdParam, 10);
      if (isNaN(idNum)) {
        return NextResponse.json({ error: 'Invalid albumId parameter' }, { status: 400 });
      }
      const res = await pool.query('SELECT * FROM albums WHERE id = $1', [idNum]);
      albumsData = res.rows;
    } else {
      const res = await pool.query('SELECT * FROM albums');
      albumsData = res.rows;
    }

    if (albumsData.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const albumIds = albumsData.map(a => a.id);
    const tracksRes = await pool.query(
      'SELECT * FROM tracks WHERE album_id = ANY($1) ORDER BY number',
      [albumIds]
    );
    const tracksData = tracksRes.rows;

    const tracksByAlbum: Record<number, Track[]> = {};
    for (const track of tracksData) {
      (tracksByAlbum[track.album_id] ||= []).push({
        id: track.id,
        number: track.number,
        title: track.title,
        lyrics: track.lyrics,
        video: track.video_url,
      });
    }

    const albumsWithTracks: Album[] = albumsData.map(album => ({
      id: album.id,
      title: album.title,
      artist: album.artist,
      year: album.year,
      image: album.image,
      description: album.description,
      tracks: tracksByAlbum[album.id] || [],
    }));

    return NextResponse.json(albumsWithTracks);
  } catch (error) {
    console.error('GET /api/albums error:', error);
    return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, artist, year, description, image, tracks } = body;
    if (!title || !artist || year == null) {
      return NextResponse.json({ error: 'Missing required album fields' }, { status: 400 });
    }

    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const albumRes = await client.query(
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

      await client.query('COMMIT');
      return NextResponse.json({ id: albumId }, { status: 201 });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('POST /api/albums transaction error:', err);
      return NextResponse.json({ error: 'Error creating album' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('POST /api/albums parse error:', error);
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { albumId, title, artist, year, description, image, tracks } = body;
    if (albumId == null) {
      return NextResponse.json({ error: 'Missing albumId for update' }, { status: 400 });
    }

    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE albums SET title=$1, artist=$2, description=$3, year=$4, image=$5 WHERE id=$6`,
        [title, artist, description ?? null, year, image ?? null, albumId]
      );

      if (Array.isArray(tracks)) {
        for (const t of tracks as Track[]) {
          if (t.id == null) continue;
          await client.query(
            `UPDATE tracks SET number=$1, title=$2, lyrics=$3, video_url=$4 WHERE id=$5 AND album_id=$6`,
            [t.number, t.title, t.lyrics ?? null, t.video ?? null, t.id, albumId]
          );
        }
      }

      await client.query('COMMIT');
      return NextResponse.json({ message: 'Album updated successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('PUT /api/albums transaction error:', err);
      return NextResponse.json({ error: 'Error updating album' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('PUT /api/albums parse error:', error);
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
