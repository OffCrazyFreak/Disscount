import { NextResponse } from "next/server";

// Public liveness probe for the Next.js server. Used by the Docker healthcheck and external
// uptime monitoring (e.g. UptimeRobot). Intentionally dependency-free so a transient DB or
// backend blip doesn't flap the frontend container - the backend's /actuator/health covers
// DB readiness separately.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
