import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user as userTable } from "@/db/auth-schema";
import { requireEnv } from "@/lib/env";
import { passwordSchema } from "@/lib/api/schemas/auth-user";

const BETTER_AUTH_URL = requireEnv("BETTER_AUTH_URL");

const registerSchema = z.object({
  email: z.email(),
  password: passwordSchema,
});

// Branches server-side but always responds identically, so existence never leaks.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
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
          // No email in the URL: it would leak via history, Referer and logs.
          redirectTo: `${BETTER_AUTH_URL}/reset-password`,
        },
      });
    } else {
      await auth.api.signUpEmail({
        body: {
          email,
          password: parsed.data.password,
          name: email.split("@")[0],
          // Better Auth signs them in en route to this success modal.
          callbackURL: "/?modal=email-verified",
        },
      });
    }
  } catch (error) {
    // Swallowed for anti-enumeration; the raw error could carry email or password.
    console.error(
      "Registration handler failed:",
      error instanceof Error ? error.name : typeof error,
    );
  }

  return NextResponse.json({ status: true });
}
