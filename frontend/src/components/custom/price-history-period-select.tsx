import { useTranslations } from "next-intl";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodOption } from "@/typings/history-period-options";

interface PriceHistoryPeriodSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabledPeriods?: PeriodOption[];
}

export default function PriceHistoryPeriodSelect({
  value,
  onChange,
  disabledPeriods = [],
}: PriceHistoryPeriodSelectProps) {
  const t = useTranslations("priceHistory");

  const periods: { value: PeriodOption; label: string }[] = [
    { value: "1W", label: t("period1W") },
    { value: "1M", label: t("period1M") },
    { value: "1Y", label: t("period1Y") },
    { value: "ALL", label: t("periodAll") },
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
