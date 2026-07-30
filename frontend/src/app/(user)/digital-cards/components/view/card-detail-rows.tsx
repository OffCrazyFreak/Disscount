"use client";

import { Badge } from "@/components/ui/badge";
import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import type { CardType } from "@/constants/card-codes";
import type { DigitalCardDto } from "@/lib/api/types";
import { getCardTypeLabel } from "@/app/(user)/digital-cards/utils/card-labels";

interface ICardDetailRowsProps {
  card: DigitalCardDto;
}

export default function CardDetailRows({ card }: ICardDetailRowsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {card.chainCode && (
          <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-sm">
            <StoreChainLogo chain={card.chainCode} width={24} height={24} />
          </span>
        )}
        <p className="text-sm text-muted-foreground">{card.storeName}</p>
        <Badge variant="outline">
          {getCardTypeLabel(card.cardType as CardType)}
        </Badge>
      </div>

      {card.note && (
        <p className="whitespace-pre-wrap rounded-md bg-muted/60 p-3 text-sm">
          {card.note}
        </p>
      )}
    </div>
  );
}
