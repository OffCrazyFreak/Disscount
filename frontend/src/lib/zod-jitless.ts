import { z } from "zod";

// The production CSP blocks eval, and Zod probes `new Function` the first time it builds
// an object schema, which logs a CSP violation even though Zod falls back. Import this
// before anything that defines a schema at module scope.
z.config({ jitless: true });
