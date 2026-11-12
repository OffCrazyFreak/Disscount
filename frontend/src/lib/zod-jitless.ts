import { z } from "zod";

// The CSP blocks eval, and Zod's `new Function` probe logs a violation; import before any module-scope schema.
z.config({ jitless: true });
