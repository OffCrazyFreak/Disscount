import { NextResponse } from "next/server";

// Dependency-free on purpose, so a backend blip can't flap this container.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
