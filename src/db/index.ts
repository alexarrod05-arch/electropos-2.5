import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required but was not provided.");
}

export const pool = new Pool({
  connectionString,
  // Most hosted Postgres providers (Neon, Render, Railway, Supabase) require SSL
  // but use certificates that Node won't validate by default. This is standard
  // for these managed providers and safe because the connection itself is still encrypted.
  ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
