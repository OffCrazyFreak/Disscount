import type { FetchStatus } from "@tanstack/react-query";

import { UserDto } from "@/lib/api/types";
import {
  isProfileOfAnotherAccount,
  mergeSessionUser,
} from "@/context/merge-session-user";
import { isUnverifiedAccount } from "@/context/sync-cache-identity";

interface IAccountInputs {
  session:
    | { user?: { id: string; name?: string | null; email?: string | null } }
    | null
    | undefined;
  sessionPending: boolean;
  sessionError: unknown;
  /** The account the last resolved session names; undefined until the first one resolves. */
  sessionAccount: string | null | undefined;
  cacheIdentity: string;
  /** The account the profile query is enabled for. */
  accountId: string | null;
  profile: UserDto | undefined;
  hasProfileFailed: boolean;
  profileFetchStatus: FetchStatus;
}

/** Offline the profile request fails, so the saved copy keeps pinned stores, name and avatar; logout clears it. */
function savedProfileOf(
  hasUnverifiedAccount: boolean,
  profile: UserDto | undefined,
  cacheIdentity: string,
): UserDto | null {
  // The previous account's entry can outlive a switch until the purge's reset lands.
  return hasUnverifiedAccount && profile?.id === cacheIdentity ? profile : null;
}

/** Which profile the tab may show, and whether one is still on its way. */
function profileVisibility({
  session,
  sessionAccount,
  accountId,
  profile,
  hasProfileFailed,
  profileFetchStatus,
}: IAccountInputs) {
  // Withheld, with the flags reading as loading and never as signed out.
  const isSwitchingAccount =
    sessionAccount !== null &&
    !hasProfileFailed &&
    isProfileOfAnotherAccount(profile ?? null, session?.user);

  // An error keeps the last data, and a refused account must not show it.
  const isOwnProfile =
    !isSwitchingAccount && !hasProfileFailed && profile?.id === accountId;
  const user = mergeSessionUser(
    isOwnProfile ? (profile ?? null) : null,
    session?.user,
  );

  // Offline the query pauses, and the saved copy stands in rather than a load that never ends.
  const isAwaitingProfile =
    accountId !== null &&
    !user &&
    !hasProfileFailed &&
    profileFetchStatus !== "paused";

  return { isSwitchingAccount, user, isAwaitingProfile };
}

export function deriveAccountState(inputs: IAccountInputs) {
  const {
    sessionPending,
    sessionError,
    sessionAccount,
    cacheIdentity,
    profile,
  } = inputs;
  const { isSwitchingAccount, user, isAwaitingProfile } =
    profileVisibility(inputs);

  const isInitializing =
    sessionPending ||
    sessionAccount === undefined ||
    isSwitchingAccount ||
    isAwaitingProfile;

  const hasUnverifiedAccount = isUnverifiedAccount(
    !!user,
    sessionPending,
    sessionError,
    cacheIdentity,
  );

  return {
    user,
    isInitializing,
    isAuthenticated: !!user || isSwitchingAccount,
    hasUnverifiedAccount,
    canShowAccountData: !!user || hasUnverifiedAccount || isSwitchingAccount,
    accountUser:
      user ?? savedProfileOf(hasUnverifiedAccount, profile, cacheIdentity),
  };
}
