import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

interface IMissingStoresNoteProps {
  shown: number;
  unplaced: number;
}

/** Says how many results the map cannot pin, so a short map is not a mystery. */
export default function MissingStoresNote({
  shown,
  unplaced,
}: IMissingStoresNoteProps) {
  const t = useTranslations("map.count");
  const count = t("shown", { count: shown });

  return (
    <p
      role="status"
      className="flex items-start gap-2 text-sm text-muted-foreground"
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>
        {unplaced > 0 ? t("unplaced", { shown: count, unplaced }) : count}
      </span>
    </p>
  );
}
