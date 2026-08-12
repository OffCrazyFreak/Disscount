import { digitalCardService } from "@/lib/api";
import type { DigitalCardDto } from "@/lib/api/types";

interface IUseDigitalCardResult {
  card: DigitalCardDto | null;
  isLoading: boolean;
  isError: boolean;
  notFound: boolean;
}

/**
 * Cards are read out of the user's own list rather than a by-id endpoint. That is what
 * makes a deep link work offline: a by-id fetch has no cached entry to fall back on.
 */
export function useDigitalCard(
  id: string | undefined,
  { enabled = true }: { enabled?: boolean } = {},
): IUseDigitalCardResult {
  const cardsQuery = digitalCardService.useGetCurrentUserDigitalCards({
    enabled: enabled && !!id,
  });

  const card = id
    ? (cardsQuery.data?.find((item) => item.id === id) ?? null)
    : null;

  return {
    card,
    isLoading: !card && cardsQuery.isLoading,
    isError: !card && cardsQuery.isError,
    notFound: !!id && !card && !cardsQuery.isLoading && !cardsQuery.isError,
  };
}
