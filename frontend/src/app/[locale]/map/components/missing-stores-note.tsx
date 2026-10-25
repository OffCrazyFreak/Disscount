import { useTranslations } from "next-intl";

interface IMissingStoresNoteProps {
  shown: number;
  unplaced: number;
}

/**
 * Announces the result count, and how many the map cannot pin, to screen
 * readers only: the count still changes with every search or filter.
 */
export default function MissingStoresNote({
  shown,
  unplaced,
}: IMissingStoresNoteProps) {
  const t = useTranslations("map.count");
  const count = t("shown", { count: shown });

  return (
    <p role="status" className="sr-only">
      {unplaced > 0 ? t("unplaced", { shown: count, unplaced }) : count}
    </p>
  );
}
