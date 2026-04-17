import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool } from "@/lib/db";
import { isValidUuid } from "@/lib/uuid";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return { ok: false as const, status: 401, error: "Unauthorized", requesterId: null };
  }
  if (session.user.role !== "admin") {
    return { ok: false as const, status: 403, error: "Forbidden", requesterId: null };
  }
  return { ok: true as const, requesterId: session.user.id };
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { id } = await context.params;
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }
    if (id === gate.requesterId) {
      return NextResponse.json({ error: "Admins cannot delete themselves" }, { status: 400 });
    }

    const result = await getPool().query("DELETE FROM users WHERE id = $1::uuid", [id]);
    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/admin/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
