import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/server-env";

// Liveness only, so no backend or DB call, and serverEnv parses just the optional GIT_SHA: a backend blip or unrelated env var can't flap this container.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    // Commit SHA (releaseId per the IETF health check draft); CI waits for it after a deploy.
    releaseId: serverEnv.GIT_SHA ?? null,
    timestamp: new Date().toISOString(),
  });
}
