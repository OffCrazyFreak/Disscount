import { useLocale, useTranslations } from "next-intl";

import CardIcon from "@/app/[locale]/(user)/digital-cards/components/card-icon";
import { formatTileDate } from "@/app/[locale]/(user)/digital-cards/utils/card-date";
import { initialsOf } from "@/app/[locale]/(user)/digital-cards/utils/card-initials";
import type { DigitalCardDto } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface ICardFaceFrontProps {
  card: DigitalCardDto;
  textColor: string;
}

export default function CardFaceFront({
  card,
  textColor,
}: ICardFaceFrontProps) {
  const t = useTranslations("digitalCards");
  const locale = useLocale();
  const date = formatTileDate(card.lastUsedAt ?? card.updatedAt, locale);
  const archived = Boolean(card.archivedAt);
  const initials = initialsOf(card.storeName);

  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl p-3 [backface-visibility:hidden] sm:p-4",
        "bg-[var(--surface)] motion-safe:transition-shadow motion-safe:duration-150",
        "forced-colors:border forced-colors:border-[color:CanvasText]",
        archived
          ? "bg-[linear-gradient(155deg,var(--surface),color-mix(in_oklab,var(--surface),var(--away)_10%))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--away)_16%,transparent),0_0_0_1px_var(--tile-outline)] outline-1 outline-dashed outline-offset-[-5px] outline-[color-mix(in_srgb,var(--ink)_50%,transparent)]"
          : "bg-[linear-gradient(155deg,var(--surface),color-mix(in_oklab,var(--surface),var(--away)_12%))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--away)_16%,transparent),0_0_0_1px_var(--tile-outline),var(--tile-shadow)]",
      )}
      style={{ color: textColor }}
    >
      {initials && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute right-[-4px] bottom-[-14px] select-none text-[72px] font-bold leading-none tracking-[-0.04em]",
            archived
              ? "text-[color-mix(in_srgb,var(--away)_12%,transparent)]"
              : "text-[color-mix(in_srgb,var(--away)_11%,transparent)]",
          )}
        >
          {initials}
        </span>
      )}

      <div className="relative flex items-center gap-2 pr-[38px]">
        <CardIcon card={card} />

        <span className="line-clamp-2 text-[14px] font-semibold leading-tight">
          {card.storeName}
        </span>
      </div>

      <div className="relative flex flex-col gap-0.5">
        <span className="line-clamp-2 text-[13px] font-semibold leading-tight">
          {card.cardName}
        </span>

        <span className="flex items-center gap-1.5 text-xs tabular-nums">
          {archived && (
            <span className="rounded-full bg-[color-mix(in_srgb,var(--away)_22%,transparent)] px-[6px] py-[1px] text-[11px] font-semibold">
              {t("tile.archivedBadge")}
            </span>
          )}
          {date}
        </span>
      </div>
    </div>
  );
}
