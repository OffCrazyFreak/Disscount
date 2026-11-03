import { authClient } from "@/lib/auth/client";
import { persistedCacheIdentity } from "@/lib/offline/cache-identity";
import {
  getLastSession,
  getPendingSignOut,
  setLastSession,
  setPendingSignOut,
} from "@/utils/browser/storage/auth";
import type { IKnownSession, IPendingSignOut } from "@/typings/local-storage";

interface ISessionLike {
  user: { id: string };
  session?: { id: string };
}

// Statuses where the server may not have ended the session, so the sign-out is sent again.
const RETRYABLE_STATUSES = new Set([408, 429]);

let finishing: Promise<void> | null = null;

/**
 * Ends the server session, or remembers to: offline the request never arrives, the
 * httpOnly cookie survives, and the account would be signed in again once back online.
 * Matched by session id, so a later sign-in, even to the same account, is never undone.
 */
export function signOutOrDefer(): Promise<void> {
  // Offline the session is unknown, so the account leaving is the one the cache names.
  const fallbackUserId = persistedCacheIdentity();
  const leaving: IKnownSession | null =
    getLastSession() ??
    (fallbackUserId ? { userId: fallbackUserId, sessionId: null } : null);
  setLastSession(null);

  return endSession(leaving && { ...leaving, isServerEnded: false });
}

/** better-auth's client throws on a network failure and returns an error for an answer. */
async function endSession(pending: IPendingSignOut | null) {
  if (pending) setPendingSignOut(pending);

  try {
    const { error } = await authClient.signOut();
    const isServerEnded =
      !error ||
      (error.status >= 400 &&
        error.status < 500 &&
        !RETRYABLE_STATUSES.has(error.status));
    if (pending) setPendingSignOut({ ...pending, isServerEnded });
  } catch {
    // Stays pending for the next session read.
  }
}

/**
 * The account a resolved session counts as. A session the user signed out of counts as
 * nobody, and is ended again if the server may still hold it; any other answer settles it.
 */
export function sessionIdentity(
  session: ISessionLike | null | undefined,
  sessionError: unknown,
): string | null {
  if (sessionError) return session?.user.id ?? null;

  const pending = getPendingSignOut();
  if (session && pending && isSameSession(session, pending)) {
    if (!pending.isServerEnded) void finishPendingSignOut();
    return null;
  }

  if (pending) setPendingSignOut(null);
  setLastSession(
    session
      ? { userId: session.user.id, sessionId: session.session?.id ?? null }
      : null,
  );
  return session?.user.id ?? null;
}

function isSameSession(session: ISessionLike, pending: IPendingSignOut) {
  return pending.sessionId !== null
    ? session.session?.id === pending.sessionId
    : session.user.id === pending.userId;
}

/** One request at a time, since every session refetch while it runs asks again. */
function finishPendingSignOut(): Promise<void> {
  finishing ??= endSession(getPendingSignOut()).finally(() => {
    finishing = null;
  });
  return finishing;
}
