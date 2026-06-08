import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next.js, so load the same env file Next.js uses.
config({ path: ".env.local" });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/auth-schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
