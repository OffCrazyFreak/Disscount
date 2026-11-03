import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { listAccountSessions } from "@/lib/auth/account-sessions";

// better-auth's /list-sessions returns every bearer token, so the list is built here instead.
export async function GET() {
  const signedIn = await auth.api.getSession({ headers: await headers() });
  if (!signedIn) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sessions = await listAccountSessions(
    signedIn.user.id,
    signedIn.session.id,
  );
  return NextResponse.json(sessions, {
    headers: { "Cache-Control": "no-store" },
  });
}
