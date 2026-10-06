import { memoryStore } from "./memory";
import { postgresStore } from "./postgres";
import type { Store } from "./types";

let cached: Store | null = null;

/**
 * DIBS_STORE=memory  -> in-memory (local development, tests; lost on restart)
 * otherwise          -> Postgres via DATABASE_URL (Supabase's connection string, or any Postgres)
 */
export function store(): Store {
  if (cached) return cached;
  cached = process.env.DIBS_STORE === "memory" ? memoryStore() : postgresStore();
  return cached;
}

export type { Store } from "./types";
