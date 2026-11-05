import "server-only";

import { sql } from "drizzle-orm";
import { APIError, getSessionFromCtx } from "better-auth/api";
import type { GenericEndpointContext } from "better-auth";

import { db } from "@/db";
import { consumeReauthCode } from "@/lib/auth/reauth/reauth-code";
import {
  REAUTH_REQUIRED,
  SENSITIVE_PATHS,
  isFreshSession,
} from "@/lib/auth/security-policy";

function reauthRequired() {
  return new APIError("FORBIDDEN", {
    code: REAUTH_REQUIRED,
    message: "Confirm it is you first",
  });
}

// Spring owns erasure_ledger; a row means the backend data is already gone and only the
// login survived, so finishing that deletion needs no second proof (the first one happened).
async function isErasedAccount(userId: string): Promise<boolean> {
  try {
    const result = await db.execute(
      sql`select 1 from erasure_ledger where user_id = ${userId} limit 1`,
    );
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

async function requireProof(ctx: GenericEndpointContext, userId: string) {
  const body: Record<string, unknown> = ctx.body ?? {};

  // better-auth checks a non-empty password itself before deleting; an empty one skips that check.
  if (typeof body.password === "string" && body.password.length > 0) return;

  if (typeof body.code === "string") {
    await consumeReauthCode(
      ctx.context.internalAdapter,
      ctx.context.secret,
      userId,
      body.code,
    );
    return;
  }

  if (await isErasedAccount(userId)) return;

  throw reauthRequired();
}

/**
 * Runs in hooks.before, which better-auth applies to HTTP requests and in-process
 * auth.api calls alike, so our own routes cannot skip the rule either.
 */
export async function guardSensitiveAction(ctx: GenericEndpointContext) {
  const requirement = ctx.path ? SENSITIVE_PATHS[ctx.path] : undefined;
  if (!requirement) return;

  if (requirement === "blocked") {
    if (ctx.request) throw new APIError("NOT_FOUND");
    return;
  }

  const signedIn = await getSessionFromCtx(ctx);
  // The endpoint's own session middleware answers the 401.
  if (!signedIn) return;

  if (requirement === "proof") {
    await requireProof(ctx, signedIn.user.id);
    return;
  }

  if (!isFreshSession(signedIn.session.createdAt)) throw reauthRequired();
}
