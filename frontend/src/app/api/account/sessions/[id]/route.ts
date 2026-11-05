import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { revokeAccountSession } from "@/lib/auth/account-sessions";

const sessionIdSchema = z.uuid();

export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/account/sessions/[id]">,
) {
  const parsedId = sessionIdSchema.safeParse((await params).id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const signedIn = await auth.api.getSession({ headers: await headers() });
  if (!signedIn) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // This device signs out through the normal sign-out, which also clears its cookie.
  if (parsedId.data === signedIn.session.id) {
    return NextResponse.json({ error: "current_session" }, { status: 400 });
  }

  const revoked = await revokeAccountSession(signedIn.user.id, parsedId.data);
  if (!revoked) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ status: true });
}
