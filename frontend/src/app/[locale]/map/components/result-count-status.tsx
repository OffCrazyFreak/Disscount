import { useTranslations } from "next-intl";

interface IResultCountStatusProps {
  shown: number;
  unplaced: number;
}

/** Screen readers only, because the count still changes with every search or filter. */
export default function ResultCountStatus({
  shown,
  unplaced,
}: IResultCountStatusProps) {
  const t = useTranslations("map.count");
  const count = t("shown", { count: shown });

  return (
    <p role="status" className="sr-only">
      {unplaced > 0 ? t("unplaced", { shown: count, unplaced }) : count}
    </p>
  );
}
