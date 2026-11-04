import { z } from "zod";

// The production CSP blocks eval, and Zod's `new Function` probe logs a violation even though it falls back; import before any module-scope schema.
z.config({ jitless: true });
