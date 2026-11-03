import { useIsRestoring } from "@tanstack/react-query";

import { useUser } from "@/context/user-context";

/**
 * Offline with nothing saved for this page: it was never opened online, so an empty
 * state would claim the account has no data when this device simply never loaded it.
 */
export function useIsNotSavedOffline(hasSavedData: boolean) {
  const { hasUnverifiedAccount } = useUser();
  const isRestoring = useIsRestoring();

  return hasUnverifiedAccount && !isRestoring && !hasSavedData;
}
