import { useTranslations } from "next-intl";

import DebouncedStatus from "@/components/custom/live-status/debounced-status";

interface IResultCountStatusProps {
  shown: number;
  unplaced: number;
}

/** Screen readers only, and debounced, because the count changes with every keystroke and filter. */
export default function ResultCountStatus({
  shown,
  unplaced,
}: IResultCountStatusProps) {
  const t = useTranslations("map.count");
  const count = t("shown", { count: shown });

  return (
    <DebouncedStatus
      message={unplaced > 0 ? t("unplaced", { shown: count, unplaced }) : count}
    />
  );
}
