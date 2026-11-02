// Production migrations without drizzle-kit: the Dockerfile bundles this into one file so the
// public migrator image carries no node_modules or app source. It writes the same
// drizzle.__drizzle_migrations journal as `drizzle-kit migrate`, so either can run next.
//
// Usage: DATABASE_URL=postgres://... node scripts/migrate.mjs
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString, max: 1 });

try {
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");
} catch (error) {
  console.error("Migration failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
