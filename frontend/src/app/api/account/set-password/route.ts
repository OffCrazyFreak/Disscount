import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { passwordSchema } from "@/lib/auth/password-policy";
import { rejectUnacceptablePassword } from "@/lib/auth/password-rejection";

export async function POST(request: Request) {
  let newPassword: unknown;
  try {
    ({ newPassword } = (await request.json()) as { newPassword?: unknown });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const parsed = passwordSchema.safeParse(newPassword);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid password" }, { status: 400 });
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
    return NextResponse.json(
      { error: "Failed to set password" },
      { status: 500 },
    );
  }
}
