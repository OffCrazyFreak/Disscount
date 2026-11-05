import "server-only";

import { APIError } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import type { GenericEndpointContext, Session, User } from "better-auth";

interface ISignedInContext extends GenericEndpointContext {
  context: GenericEndpointContext["context"] & {
    session: { session: Session; user: User };
  };
}

/**
 * Swaps this device's session for a new one after a proof. better-auth counts freshness
 * from session.createdAt only, so this is what restarts the clock, and OWASP asks for a
 * new session id after re-authentication anyway.
 */
export async function rotateSession(ctx: ISignedInContext): Promise<void> {
  const { session, user } = ctx.context.session;
  const dontRememberMe = Boolean(
    await ctx.getSignedCookie(
      ctx.context.authCookies.dontRememberToken.name,
      ctx.context.secret,
    ),
  );

  const renewed = await ctx.context.internalAdapter.createSession(
    user.id,
    dontRememberMe,
  );
  if (!renewed) {
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: "Failed to renew the session",
    });
  }

  await setSessionCookie(ctx, { session: renewed, user }, dontRememberMe);
  await ctx.context.internalAdapter.deleteSession(session.token);
}
