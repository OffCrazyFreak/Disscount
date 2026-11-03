import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as authSchema from "@/db/auth-schema";
import * as storeLocationSchema from "@/db/store-location-schema";
import * as emailSendSchema from "@/db/email-send-schema";
import { serverEnv } from "@/lib/server-env";

const pool = new Pool({ connectionString: serverEnv.DATABASE_URL });

export const db = drizzle(pool, {
  schema: { ...authSchema, ...storeLocationSchema, ...emailSendSchema },
});
