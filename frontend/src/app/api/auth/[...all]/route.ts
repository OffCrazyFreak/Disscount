import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// All better-auth endpoints (sign-in/up/out, social callbacks, /jwks, /token, ...)
// are served here by Next.js. The next.config rewrite proxies the rest of /api/*
// to the Spring backend, but explicitly excludes /api/auth/*.
export const { GET, POST } = toNextJsHandler(auth);
