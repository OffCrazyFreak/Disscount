import CardIcon from "@/app/(user)/digital-cards/components/card-icon";
import { formatTileDate } from "@/app/(user)/digital-cards/utils/card-date";
import type { DigitalCardDto } from "@/lib/api/types";

interface ICardFaceFrontProps {
  card: DigitalCardDto;
  textColor: string;
}

export default function CardFaceFront({
  card,
  textColor,
}: ICardFaceFrontProps) {
  const date = formatTileDate(card.lastUsedAt ?? card.updatedAt);

  return (
    <div
      className="absolute inset-0 flex flex-col justify-between rounded-2xl p-3 shadow-sm [backface-visibility:hidden] sm:p-4"
      style={{ backgroundColor: card.cardColor, color: textColor }}
    >
      <div className="flex items-center gap-2 pr-9">
        <CardIcon card={card} />

        <span className="line-clamp-2 text-sm font-semibold leading-tight sm:text-base">
          {card.storeName}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className="line-clamp-2 min-w-0 text-sm leading-tight">
          {card.cardName}
        </span>

        <span className="shrink-0 text-xs tabular-nums opacity-80">{date}</span>
      </div>
    </div>
  );
}
