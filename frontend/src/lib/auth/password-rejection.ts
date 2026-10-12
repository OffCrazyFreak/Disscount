import "server-only";

import { NextResponse } from "next/server";
import { APIError } from "better-auth/api";

import { assertPasswordAcceptable } from "@/lib/auth/breached-password";

// For our own account routes, which answer with { error } rather than better-auth's shape.
export async function rejectUnacceptablePassword(
  password: string,
): Promise<NextResponse | null> {
  try {
    await assertPasswordAcceptable(password);
    return null;
  } catch (error) {
    if (!(error instanceof APIError)) throw error;

    return NextResponse.json(
      { error: error.body?.code, message: error.body?.message },
      { status: 400 },
    );
  }
}
