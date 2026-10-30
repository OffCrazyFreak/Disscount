import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  PASSWORD_LENGTH_INVALID,
  PASSWORD_LENGTH_MESSAGE,
  passwordSchema,
} from "@/lib/auth/password-policy";
import { rejectUnacceptablePassword } from "@/lib/auth/password-rejection";

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

  const rejection = await rejectUnacceptablePassword(parsed.data);
  if (rejection) return rejection;

  try {
    // setPassword is a server-only better-auth action; the session is resolved from cookies.
    await auth.api.setPassword({
      body: { newPassword: parsed.data },
      headers: await headers(),
    });

    return NextResponse.json({ status: true });
  } catch {
    return NextResponse.json({ error: "set_password_failed" }, { status: 500 });
  }
}
