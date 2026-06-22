import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { requireEnv } from "@/lib/env";
import { passwordSchema } from "@/lib/api/schemas/auth-user";

const registerSchema = z.object({
  email: z.email(),
  password: passwordSchema,
});

// Email+password registration that also works when the email already has a social account.
// Branches server-side and always responds the same way (no account-existence enumeration):
// - new email -> normal sign-up, which sends the verification email
// - existing account -> a "set your password" link via the reset flow, which links a credential
//   account for password-less (Google/Facebook) users, giving them email login too.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const ctx = await auth.$context;
  const existing = await ctx.internalAdapter.findUserByEmail(email);

  if (existing) {
    await auth.api.requestPasswordReset({
      body: {
        email,
        // email is carried back so the reset page can sign the user in automatically.
        redirectTo: `${requireEnv("BETTER_AUTH_URL")}/reset-password?email=${encodeURIComponent(email)}`,
      },
    });
  } else {
    await auth.api.signUpEmail({
      body: {
        email,
        password: parsed.data.password,
        name: email.split("@")[0],
      },
    });
  }

  return NextResponse.json({ status: true });
}
