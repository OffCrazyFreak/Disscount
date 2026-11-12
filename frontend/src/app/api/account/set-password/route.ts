import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  PASSWORD_LENGTH_INVALID,
  PASSWORD_LENGTH_MESSAGE,
  passwordSchema,
} from "@/lib/auth/password-policy";
import { rejectUnacceptablePassword } from "@/lib/auth/password-rejection";
import { REAUTH_REQUIRED, isFreshSession } from "@/lib/auth/security-policy";
import { recordSecurityEvent } from "@/lib/security-events/record-security-event";

export async function POST(request: Request) {
  let newPassword: unknown;
  try {
    ({ newPassword } = (await request.json()) as { newPassword?: unknown });
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const parsed = passwordSchema.safeParse(newPassword);
  if (!parsed.success) {
    return NextResponse.json(
      { error: PASSWORD_LENGTH_INVALID, message: PASSWORD_LENGTH_MESSAGE },
      { status: 400 },
    );
  }

  const requestHeaders = await headers();
  const signedIn = await auth.api.getSession({ headers: requestHeaders });
  if (!signedIn) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // setPassword has no HTTP path for the auth hook to match, so the rule is applied here.
  if (!isFreshSession(signedIn.session.createdAt)) {
    return NextResponse.json({ error: REAUTH_REQUIRED }, { status: 403 });
  }

  const rejection = await rejectUnacceptablePassword(parsed.data);
  if (rejection) return rejection;

  try {
    // setPassword is a server-only better-auth action; the session is resolved from cookies.
    await auth.api.setPassword({
      body: { newPassword: parsed.data },
      headers: requestHeaders,
    });
  } catch {
    return NextResponse.json({ error: "set_password_failed" }, { status: 500 });
  }

  // Outside the try, so a failed audit write can never turn a set password into an error.
  await recordSecurityEvent("authn_password_set", {
    userId: signedIn.session.userId,
    headers: requestHeaders,
  });

  return NextResponse.json({ status: true });
}
