import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PriceHistoryPeriodSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PriceHistoryPeriodSelect({
  value,
  onChange,
}: PriceHistoryPeriodSelectProps) {
  return (
    <TabsList>
      <TabsTrigger value="1W">1W</TabsTrigger>
      <TabsTrigger value="1M">1M</TabsTrigger>
      <TabsTrigger value="1Y">1Y</TabsTrigger>
      <TabsTrigger value="ALL">All</TabsTrigger>
    </TabsList>
  );
}
