import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user as userTable } from "@/db/auth-schema";
import { requireEnv } from "@/lib/env";
import { passwordSchema } from "@/lib/api/schemas/auth-user";

const registerSchema = z.object({
  email: z.email(),
  password: passwordSchema,
});

// Email+password registration that also works when the email already has a social account.
// It branches server-side and ALWAYS responds the same way, so account existence never leaks:
//   - new email       -> normal sign-up, which sends the verification email
//   - existing account -> a reset link (which links a credential for password-less OAuth users),
//                         worded as "set" or "reset" depending on the account state.
// Either way the client just shows a neutral "check your inbox" notice.
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

  // Better Auth normalizes stored emails to lowercase, so match on the lowercased input.
  const email = parsed.data.email.toLowerCase();

  try {
    const existing = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);

    if (existing.length > 0) {
      await auth.api.requestPasswordReset({
        body: {
          email,
          // Carry the email back so the reset page can sign the user in automatically.
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
  } catch (error) {
    // Swallow to keep the response identical regardless of branch/outcome (anti-enumeration);
    // log server-side so real failures are still observable.
    console.error("Registration handler failed:", error);
  }

  return NextResponse.json({ status: true });
}
