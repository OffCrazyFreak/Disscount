import { useCallback, useEffect, useState } from "react";
import {
  getShoppingListPriceHistoryChains,
  setShoppingListPriceHistoryChains,
} from "@/utils/browser/local-storage";

export function usePriceHistoryChains(
  shoppingListId: string,
  availableChains: string[],
  pinnedStoreIds: string[],
  areChainsReady: boolean,
) {
  const [selectedChains, setSelectedChains] = useState<string[]>([]);

  // A partial list would persist a wrong fallback and drop not-yet-loaded saved chains.
  useEffect(() => {
    if (!areChainsReady || availableChains.length === 0) return;

    const savedChains = getShoppingListPriceHistoryChains(shoppingListId);

    if (savedChains && savedChains.length > 0) {
      const validSavedChains = savedChains.filter((chain) =>
        availableChains.includes(chain),
      );
      if (validSavedChains.length > 0) {
        setSelectedChains(validSavedChains);
        return;
      }
    }

    const preferredChains = availableChains.filter((chain) =>
      pinnedStoreIds.includes(chain),
    );

    const chainsToSet =
      preferredChains.length > 0 ? preferredChains : availableChains;
    setSelectedChains(chainsToSet);
    setShoppingListPriceHistoryChains(shoppingListId, chainsToSet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableChains.join(","), shoppingListId, areChainsReady]);

  const handleChainsChange = useCallback(
    (chains: string[]) => {
      if (chains.length > 0) {
        setSelectedChains(chains);
        setShoppingListPriceHistoryChains(shoppingListId, chains);
      }
    },
    [shoppingListId],
  );

  return { selectedChains, handleChainsChange };
}
