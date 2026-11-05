import { useLocale, useTranslations } from "next-intl";

import {
  formatCardDate,
  formatCardMoney,
} from "@/app/[locale]/(user)/digital-cards/utils/format-card-values";
import { CARD_TYPE_LABEL_KEYS } from "@/constants/card-codes";
import type { DigitalCardDto } from "@/lib/api/types";

interface ICardDetailRowsProps {
  card: DigitalCardDto;
}

export default function CardDetailRows({ card }: ICardDetailRowsProps) {
  const t = useTranslations("digitalCards");
  const tAll = useTranslations();
  const locale = useLocale();

  function balanceText(balance: number, unit: string | null) {
    if (unit) return formatCardMoney(balance, unit, locale);

    // A fraction cannot take the counted plural form, so it has its own wording.
    return Number.isInteger(balance)
      ? t("view.details.points", { count: balance })
      : t("view.details.pointsFraction", { count: balance });
  }

  const rows: [string, string][] = [
    [t("view.details.type"), tAll(CARD_TYPE_LABEL_KEYS[card.cardType])],
    [t("view.details.store"), card.storeName],
  ];

  if (card.note) rows.push([t("view.details.note"), card.note]);
  if (card.validFrom) {
    rows.push([
      t("view.details.validFrom"),
      formatCardDate(card.validFrom, locale),
    ]);
  }
  if (card.expiresOn) {
    rows.push([
      t("view.details.validTo"),
      formatCardDate(card.expiresOn, locale),
    ]);
  }
  if (card.balance !== null) {
    rows.push([
      t("view.details.balance"),
      balanceText(card.balance, card.balanceUnit),
    ]);
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
