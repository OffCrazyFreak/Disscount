import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required. Check your .env.local file.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/auth-schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
});
