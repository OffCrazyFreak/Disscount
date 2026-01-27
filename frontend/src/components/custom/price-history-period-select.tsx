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
  const periods: { value: PeriodOption; label: string }[] = [
    { value: "1W", label: "1W" },
    { value: "1M", label: "1M" },
    { value: "1Y", label: "1Y" },
    { value: "ALL", label: "All" },
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
