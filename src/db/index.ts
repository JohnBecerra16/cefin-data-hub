import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getServerEnv } from "@/lib/config/server-env";
import * as schema from "./schema";

const globalForDatabase = globalThis as typeof globalThis & {
  cefinPool?: Pool;
  cefinDb?: ReturnType<typeof drizzle<typeof schema>>;
};

function createDatabase() {
  const { DATABASE_URL } = getServerEnv();
  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });
  globalForDatabase.cefinPool = pool;
  globalForDatabase.cefinDb = drizzle(pool, { schema });
  return globalForDatabase.cefinDb;
}

/** Lazy server-side connection. Never import this module into client components. */
export function getDatabase() {
  return globalForDatabase.cefinDb ?? createDatabase();
}
