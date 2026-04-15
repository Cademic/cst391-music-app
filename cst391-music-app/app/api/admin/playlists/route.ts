import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import type { PlaylistSummary } from "@/lib/types";

export const runtime = "nodejs";

interface PlaylistListRow {
  id: string;
  name: string;
  owner_user_id: string | null;
  created_at: Date;
  track_count: number;
}

export async function GET() {
  try {
    const result = await getPool().query<PlaylistListRow>(
      `SELECT p.id, p.name, p.owner_user_id, p.created_at,
        COUNT(pt.track_id)::int AS track_count
       FROM playlists p
       LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );
    const body: PlaylistSummary[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      ownerUserId: row.owner_user_id,
      createdAt: row.created_at.toISOString(),
      trackCount: row.track_count,
    }));
    return NextResponse.json(body);
  } catch (error) {
    console.error("GET /api/admin/playlists error:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}
