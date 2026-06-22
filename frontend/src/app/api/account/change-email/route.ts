import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { account } from "@/db/auth-schema";

const bodySchema = z.object({ newEmail: z.email() });

// Server-side guard for the "one email defines the user" invariant. Changing the account email
// while a social provider is linked would let a provider login carry a different email than the
// account — so we block the change until every social account is unlinked, leaving only the
// password (credential). This holds regardless of which UI calls it.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const linkedSocial = await db
    .select({ id: account.id })
    .from(account)
    .where(
      and(
        eq(account.userId, session.user.id),
        ne(account.providerId, "credential"),
      ),
    )
    .limit(1);

  if (linkedSocial.length > 0) {
    return NextResponse.json({ error: "social_linked" }, { status: 409 });
  }

  try {
    // Sends a confirmation to the CURRENT address; the change applies only after it's clicked.
    await auth.api.changeEmail({
      body: { newEmail: parsed.data.newEmail.toLowerCase() },
      headers: requestHeaders,
    });
  } catch {
    return NextResponse.json({ error: "Failed to change email" }, { status: 500 });
  }

  return NextResponse.json({ status: true });
}
