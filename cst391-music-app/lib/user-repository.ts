import { getPool } from "@/lib/db";

export interface AppUserRow {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "user" | "admin";
}

export interface AppUserWithPasswordRow extends AppUserRow {
  password_hash: string | null;
}

function parseAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Creates or updates a user from OAuth profile data and applies ADMIN_EMAILS promotion.
 */
export async function upsertUserFromOAuth(params: {
  email: string;
  name: string | null;
  image: string | null;
}): Promise<AppUserRow> {
  const emailLower = params.email.toLowerCase();
  const isListedAdmin = parseAdminEmails().includes(emailLower);

  const result = await getPool().query<AppUserRow>(
    `INSERT INTO users (email, name, image, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET
       name = COALESCE(EXCLUDED.name, users.name),
       image = COALESCE(EXCLUDED.image, users.image),
       role = CASE
         WHEN $5 THEN 'admin'::varchar
         ELSE users.role
       END
     RETURNING id, email, name, image, role`,
    [
      params.email,
      params.name,
      params.image,
      isListedAdmin ? "admin" : "user",
      isListedAdmin,
    ]
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("upsertUserFromOAuth: no row returned");
  }
  return row;
}

export async function getUserByEmailForAuth(
  email: string
): Promise<AppUserWithPasswordRow | null> {
  const result = await getPool().query<AppUserWithPasswordRow>(
    `SELECT id, email, name, image, role, password_hash
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email]
  );
  return result.rows[0] ?? null;
}

export async function createUserWithPassword(params: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<AppUserRow> {
  const emailLower = params.email.toLowerCase();
  const isListedAdmin = parseAdminEmails().includes(emailLower);

  const result = await getPool().query<AppUserRow>(
    `INSERT INTO users (email, name, role, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, image, role`,
    [
      params.email,
      params.name,
      isListedAdmin ? "admin" : "user",
      params.passwordHash,
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("createUserWithPassword: no row returned");
  }
  return row;
}

export async function getUserById(id: string): Promise<AppUserRow | null> {
  const result = await getPool().query<AppUserRow>(
    `SELECT id, email, name, image, role FROM users WHERE id = $1::uuid`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function listUsersForAdmin(limit = 200): Promise<AppUserRow[]> {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(500, Math.floor(limit))) : 200;
  const result = await getPool().query<AppUserRow>(
    `SELECT id, email, name, image, role
     FROM users
     ORDER BY LOWER(email) ASC
     LIMIT $1`,
    [safeLimit]
  );
  return result.rows;
}
