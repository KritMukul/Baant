// Creates the tables: npm run db:init   (uses DATABASE_URL; safe to run twice)
import { readFileSync } from "node:fs";
import { pool } from "../src/server/store/postgres.ts";

const sql = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
const db = pool();
await db.query(sql);
const { rows } = await db.query("select count(*)::int as n from information_schema.tables where table_schema = 'public' and table_name in ('bills','items','charges','participants','claims','payments','bill_secrets','participant_secrets')");
console.log(rows[0].n === 8 ? "Database is ready (8 tables)." : `Expected 8 tables, found ${rows[0].n}.`);
await db.end();
process.exit(rows[0].n === 8 ? 0 : 1);
