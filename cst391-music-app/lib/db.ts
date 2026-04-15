import { Pool } from "pg";

let poolInstance: Pool | undefined;

/**
 * Lazy Postgres pool so importing this module during `next build` does not
 * require DATABASE_URL (set it in Vercel → Environment Variables for runtime).
 */
export function getPool(): Pool {
  if (!poolInstance) {
    const connectionString =
      process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "POSTGRES_URL or DATABASE_URL environment variable is not set."
      );
    }
    poolInstance = new Pool({
      connectionString,
    });
  }
  return poolInstance;
}

export interface DatabaseHealth {
  isConnected: boolean;
}

export async function checkDatabaseConnection(): Promise<DatabaseHealth> {
  const result = await getPool().query("SELECT 1 AS result");
  const isConnected = result.rows?.[0]?.result === 1;

  return { isConnected };
}

/** Returns the first artist from the albums table, or null if empty. */
export async function getFirstArtist(): Promise<string | null> {
  const result = await getPool().query<{ artist: string }>(
    "SELECT artist FROM albums LIMIT 1"
  );
  const row = result.rows?.[0];
  return row?.artist ?? null;
}
