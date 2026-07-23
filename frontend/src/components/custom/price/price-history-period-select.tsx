import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodOption } from "@/typings/history-period-options";

// Selection lives in the parent Radix Tabs context; each trigger carries its value.
interface IPriceHistoryPeriodSelectProps {
  disabledPeriods?: PeriodOption[];
}

export default function PriceHistoryPeriodSelect({
  disabledPeriods = [],
}: IPriceHistoryPeriodSelectProps) {
  const periods: { value: PeriodOption; label: string }[] = [
    { value: "1W", label: "1T" },
    { value: "1M", label: "1M" },
    { value: "1Y", label: "1G" },
    { value: "ALL", label: "Sve" },
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
