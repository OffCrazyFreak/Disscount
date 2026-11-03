import { useUser } from "@/context/user-context";
import { digitalCardService } from "@/lib/api";

/** The signed-in account's cards, and whether the wallet may show them at all. */
export function useWalletCards() {
  const {
    isAuthenticated,
    hasUnverifiedAccount,
    isLoading: userLoading,
  } = useUser();
  const { data: cards = [], isLoading } =
    digitalCardService.useGetMyDigitalCards({ enabled: isAuthenticated });

  return {
    cards,
    // Offline the session check fails, yet the cards saved on this device are exactly
    // what the till needs; a disabled query still returns them.
    canShowCards: isAuthenticated || hasUnverifiedAccount,
    isAuthLoading: userLoading,
    isLoading: userLoading || isLoading,
  };
}
