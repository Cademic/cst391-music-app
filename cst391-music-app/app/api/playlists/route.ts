import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import type { PlaylistSummary } from "@/lib/types";
import { isValidUuid } from "@/lib/uuid";

export const runtime = "nodejs";

interface PlaylistListRow {
  id: string;
  name: string;
  owner_user_id: string | null;
  created_at: Date;
  track_count: number;
}

interface PlaylistInsertRow {
  id: string;
  name: string;
  owner_user_id: string | null;
  created_at: Date;
}

function toSummary(row: PlaylistListRow): PlaylistSummary {
  return {
    id: row.id,
    name: row.name,
    ownerUserId: row.owner_user_id,
    createdAt: row.created_at.toISOString(),
    trackCount: row.track_count,
  };
}

export async function GET(request: NextRequest) {
  try {
    const ownerUserId = request.nextUrl.searchParams.get("ownerUserId");
    if (ownerUserId && !isValidUuid(ownerUserId)) {
      return NextResponse.json(
        { error: "Invalid ownerUserId query parameter" },
        { status: 400 }
      );
    }

    let sql = `
      SELECT p.id, p.name, p.owner_user_id, p.created_at,
        COUNT(pt.track_id)::int AS track_count
      FROM playlists p
      LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
    `;
    const params: string[] = [];
    if (ownerUserId) {
      sql += ` WHERE p.owner_user_id = $1::uuid`;
      params.push(ownerUserId);
    }
    sql += ` GROUP BY p.id ORDER BY p.created_at DESC`;

    const result = await getPool().query<PlaylistListRow>(sql, params);
    const body: PlaylistSummary[] = result.rows.map(toSummary);
    return NextResponse.json(body);
  } catch (error) {
    console.error("GET /api/playlists error:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = body?.name as string | undefined;
    const ownerUserId = body?.ownerUserId as string | null | undefined;

    if (name == null || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Missing or invalid name" },
        { status: 400 }
      );
    }
    if (name.length > 100) {
      return NextResponse.json(
        { error: "name must be at most 100 characters" },
        { status: 400 }
      );
    }

    let ownerUuid: string | null = null;
    if (ownerUserId !== undefined && ownerUserId !== null) {
      if (typeof ownerUserId !== "string" || !isValidUuid(ownerUserId)) {
        return NextResponse.json(
          { error: "Invalid ownerUserId" },
          { status: 400 }
        );
      }
      ownerUuid = ownerUserId;
    }

    const result = await getPool().query<PlaylistInsertRow>(
      `INSERT INTO playlists (name, owner_user_id)
       VALUES ($1, $2::uuid)
       RETURNING id, name, owner_user_id, created_at`,
      [name.trim(), ownerUuid]
    );
    const row = result.rows[0];
    const created: PlaylistSummary = {
      id: row.id,
      name: row.name,
      ownerUserId: row.owner_user_id,
      createdAt: row.created_at.toISOString(),
      trackCount: 0,
    };
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/playlists error:", error);
    return NextResponse.json(
      { error: "Failed to create playlist" },
      { status: 500 }
    );
  }
}
