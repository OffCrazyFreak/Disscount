import { useIsRestoring } from "@tanstack/react-query";

import { useUser } from "@/context/user-context";
import { digitalCardService } from "@/lib/api";
import { useIsNotSavedOffline } from "@/hooks/use-is-not-saved-offline";

/** The signed-in account's cards, and whether the wallet may show them at all. */
export function useWalletCards() {
  const {
    isAuthenticated,
    canShowAccountData,
    isLoading: userLoading,
  } = useUser();
  const {
    data: cards = [],
    isLoading,
    isSuccess,
  } = digitalCardService.useGetMyDigitalCards({ enabled: isAuthenticated });
  // Offline the failed session check lands before IndexedDB is read back, and an empty
  // wallet then would also spend the single card auto-open.
  const isRestoring = useIsRestoring();
  const isNotSavedOffline = useIsNotSavedOffline(isSuccess);

  return {
    cards,
    // Offline the session check fails, yet the cards saved on this device are exactly
    // what the till needs; a disabled query still returns them.
    canShowCards: canShowAccountData,
    isNotSavedOffline,
    isAuthLoading: userLoading,
    isLoading: userLoading || isLoading || isRestoring,
  };
}
