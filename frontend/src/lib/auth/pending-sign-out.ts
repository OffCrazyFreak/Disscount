import { authClient } from "@/lib/auth/client";
import { persistedCacheIdentity } from "@/lib/offline/cache-identity";
import {
  getPendingSignOut,
  setPendingSignOut,
} from "@/utils/browser/storage/auth";
import type { IPendingSignOut } from "@/typings/local-storage";

interface ISessionLike {
  user: { id: string };
  session: { createdAt: Date | string };
}

let finishing: Promise<void> | null = null;

/**
 * Ends the server session, or remembers to: offline the request never arrives, the
 * httpOnly cookie survives, and the account would be signed in again once back online.
 * better-auth's client throws on a network failure and returns an error for an answer.
 */
export function signOutOrDefer(sessionUserId: string | null): Promise<void> {
  // Offline the session is unknown, so the account leaving is the one the cache names.
  const userId = sessionUserId ?? persistedCacheIdentity();
  return endSession(userId ? { userId, signedOutAt: Date.now() } : null);
}

async function endSession(pending: IPendingSignOut | null) {
  try {
    const { error } = await authClient.signOut();
    // A 5xx may have left the session alive; a 4xx means there is none left to end.
    setPendingSignOut(error && error.status >= 500 ? pending : null);
  } catch {
    setPendingSignOut(pending);
  }
}

/**
 * The account a resolved session counts as. The cookie outlives a sign-out made offline,
 * so that session is ended here and counts as nobody; any other answer settles it.
 */
export function sessionIdentity(
  session: ISessionLike | null | undefined,
  sessionError: unknown,
): string | null {
  if (isSignedOutOffline(session)) {
    void finishPendingSignOut();
    return null;
  }

  if (!sessionError) forgetPendingSignOut();
  return session?.user.id ?? null;
}

/** A session the user already signed out of offline; a later sign-in is a new session. */
function isSignedOutOffline(session: ISessionLike | null | undefined) {
  const pending = getPendingSignOut();
  if (!session || !pending) return false;

  return (
    session.user.id === pending.userId &&
    new Date(session.session.createdAt).getTime() <= pending.signedOutAt
  );
}

function forgetPendingSignOut() {
  if (getPendingSignOut()) setPendingSignOut(null);
}

/** One request at a time, since every session refetch while it runs asks again. */
function finishPendingSignOut(): Promise<void> {
  finishing ??= endSession(getPendingSignOut()).finally(() => {
    finishing = null;
  });
  return finishing;
}
