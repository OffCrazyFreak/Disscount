import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as authSchema from "@/db/auth-schema";
import * as storeLocationSchema from "@/db/store-location-schema";
import * as storeHoursSchema from "@/db/store-hours-schema";
import * as emailSendSchema from "@/db/email-send-schema";
import * as securityEventSchema from "@/db/security-event-schema";
import { serverEnv } from "@/lib/server-env";

const pool = new Pool({
  connectionString: serverEnv.DATABASE_URL,
  max: 10,
  // Without it a request waits forever for a free connection; 5 s fails well before the proxy's 30 s deadline.
  connectionTimeoutMillis: 5_000,
});

export const db = drizzle(pool, {
  schema: {
    ...authSchema,
    ...storeLocationSchema,
    ...storeHoursSchema,
    ...emailSendSchema,
    ...securityEventSchema,
  },
});
