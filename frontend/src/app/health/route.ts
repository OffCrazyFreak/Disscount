import { NextResponse } from "next/server";

// Dependency-free liveness probe for the Docker healthcheck and UptimeRobot, so a
// backend blip can't flap this container; DB readiness is covered by the backend's /actuator/health.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    // Commit SHA (releaseId per the IETF health check draft); CI waits for it after a deploy.
    releaseId: process.env.GIT_SHA || null,
    timestamp: new Date().toISOString(),
  });
}
