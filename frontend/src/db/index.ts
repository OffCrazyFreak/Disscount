import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./auth-schema";

// Shared Postgres pool. The connection string points at the same database the
// Spring backend uses; better-auth owns the auth tables (user/session/account/
// verification/jwks) while the backend owns the business tables (app_user, ...).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle({ client: pool, schema });
