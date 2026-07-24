"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";

export interface ISortSelectOption {
  value: string;
  label: string;
  comingSoon?: boolean;
}

interface ISortSelectProps<TMode extends string> {
  label: string;
  value: TMode;
  onValueChange: (mode: TMode) => void;
  options: readonly ISortSelectOption[];
}

/** Leading label and dropdown for ordering a list, shared by every list that offers one. */
export default function SortSelect<TMode extends string>({
  label,
  value,
  onValueChange,
  options,
}: ISortSelectProps<TMode>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>

      <Select
        value={value}
        onValueChange={(mode) => onValueChange(mode as TMode)}
      >
        {/* The trigger keeps the primitive's w-fit so its label never clips, and
            min-h beats the primitive's own height where a plain h- utility loses. */}
        <SelectTrigger className="min-h-10 min-w-52 bg-white">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.comingSoon}
            >
              {option.comingSoon ? (
                <span className="flex items-center gap-2">
                  {option.label}
                  <ComingSoonBadge />
                </span>
              ) : (
                option.label
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
