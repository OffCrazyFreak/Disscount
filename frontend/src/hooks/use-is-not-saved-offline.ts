import { useIsRestoring } from "@tanstack/react-query";

import { useUser } from "@/context/user-context";
import { isOffline } from "@/lib/api/query-client-defaults";

/**
 * Offline with nothing saved for this page: it was never opened online, so an empty
 * state would claim the account has no data when this device simply never loaded it.
 */
export function useIsNotSavedOffline(hasSavedData: boolean) {
  const { hasUnverifiedAccount } = useUser();
  const isRestoring = useIsRestoring();

  // A failed session check online (a 5xx) is unverified too, but nothing is "not saved".
  return hasUnverifiedAccount && !isRestoring && !hasSavedData && isOffline();
}
