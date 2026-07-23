import { NextResponse } from "next/server";

// Dependency-free liveness probe for the Docker healthcheck and UptimeRobot, so a
// backend blip can't flap this container; DB readiness is covered by the backend's /actuator/health.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
