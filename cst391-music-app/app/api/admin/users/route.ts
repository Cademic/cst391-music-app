import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listUsersForAdmin } from "@/lib/user-repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "200");
    const users = await listUsersForAdmin(limitParam);
    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
