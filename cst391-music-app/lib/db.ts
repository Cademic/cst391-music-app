import { Pool } from "pg";

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("POSTGRES_URL environment variable is not set.");
}

const pool = new Pool({
  connectionString,
});

export interface DatabaseHealth {
  isConnected: boolean;
}

export async function checkDatabaseConnection(): Promise<DatabaseHealth> {
  const result = await pool.query("SELECT 1 AS result");
  const isConnected = result.rows?.[0]?.result === 1;

  return { isConnected };
}

export { pool };
