import { pgSchema } from "drizzle-orm/pg-core";

// One schema per database login, so Spring's login never reaches these (docs/INFRASTRUCTURE.md, Database roles).
export const authPgSchema = pgSchema("auth");

export const webPgSchema = pgSchema("web");
