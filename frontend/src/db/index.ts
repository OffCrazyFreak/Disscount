import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as authSchema from "@/db/auth-schema";
import * as storeLocationSchema from "@/db/store-location-schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required.");
}

const pool = new Pool({ connectionString });

export const db = drizzle(pool, {
  schema: { ...authSchema, ...storeLocationSchema },
});
