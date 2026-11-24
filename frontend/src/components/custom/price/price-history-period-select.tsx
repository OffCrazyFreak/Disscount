import { useTranslations } from "next-intl";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodOption } from "@/typings/history-period-options";

// Selection lives in the parent Radix Tabs context; each trigger carries its value.
interface IPriceHistoryPeriodSelectProps {
  disabledPeriods?: PeriodOption[];
}

export default function PriceHistoryPeriodSelect({
  disabledPeriods = [],
}: IPriceHistoryPeriodSelectProps) {
  const t = useTranslations("products");
  const periods: { value: PeriodOption; label: string }[] = [
    { value: "1W", label: t("historyPeriod.week") },
    { value: "1M", label: t("historyPeriod.month") },
    { value: "1Y", label: t("historyPeriod.year") },
    { value: "ALL", label: t("historyPeriod.all") },
  ];

  return (
    <TabsList>
      {periods.map((period) => (
        <TabsTrigger
          key={period.value}
          value={period.value}
          disabled={disabledPeriods.includes(period.value)}
        >
          {period.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
