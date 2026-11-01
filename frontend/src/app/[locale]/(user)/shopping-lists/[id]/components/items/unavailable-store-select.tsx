import { useId } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getChainLabel } from "@/utils/labels";

interface IUnavailableStoreSelectProps {
  value: string | null | undefined;
  reason: string;
  /** Points at a fuller explanation elsewhere; without one the reason itself describes the select. */
  describedById?: string;
  disabled: boolean;
  className?: string;
}

/**
 * The store select of an item with no prices to compare. It stays focusable, so a
 * keyboard or screen reader user still reaches the reason, but it never opens and has
 * no change handler, since typeahead on a closed Radix trigger still selects.
 */
export default function UnavailableStoreSelect({
  value,
  reason,
  describedById,
  disabled,
  className,
}: IUnavailableStoreSelectProps) {
  const reasonId = useId();

  return (
    <Select value={value ?? ""} open={false} disabled={disabled}>
      <SelectTrigger
        aria-disabled="true"
        aria-describedby={describedById ?? reasonId}
        className={cn(
          "min-w-0 text-xs sm:text-sm aria-disabled:cursor-not-allowed",
          className,
        )}
      >
        <SelectValue placeholder={reason} />
      </SelectTrigger>

      {!describedById && (
        <span id={reasonId} className="sr-only">
          {reason}
        </span>
      )}

      <SelectContent>
        {value && (
          <SelectItem value={value}>
            <span lang="hr">{getChainLabel(value)}</span>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
