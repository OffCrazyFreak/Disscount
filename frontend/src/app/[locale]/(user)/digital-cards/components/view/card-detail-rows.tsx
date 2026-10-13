import { CARD_TYPE_LABELS } from "@/constants/card-codes";
import {
  formatCardBalance,
  formatCardDate,
} from "@/app/[locale]/(user)/digital-cards/utils/format-card-values";
import type { DigitalCardDto } from "@/lib/api/types";

interface ICardDetailRowsProps {
  card: DigitalCardDto;
}

export default function CardDetailRows({ card }: ICardDetailRowsProps) {
  const rows: [string, string][] = [
    ["Vrsta", CARD_TYPE_LABELS[card.cardType]],
    ["Trgovina", card.storeName],
  ];

  if (card.note) rows.push(["Bilješka", card.note]);
  if (card.validFrom) rows.push(["Vrijedi od", formatCardDate(card.validFrom)]);
  if (card.expiresOn) rows.push(["Vrijedi do", formatCardDate(card.expiresOn)]);
  if (card.balance !== null) {
    rows.push(["Stanje", formatCardBalance(card.balance, card.balanceUnit)]);
  }

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="break-words font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
