import { useId } from "react";

import { Select, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface IUnavailableStoreSelectProps {
  /** What the trigger shows: the reason, with the saved store in front when there is one. */
  label: string;
  reason: string;
  /** Points at a fuller explanation elsewhere; without one the reason itself describes the select. */
  describedById?: string;
  disabled: boolean;
  className?: string;
}

/**
 * The store select of an item with no prices to compare. It stays focusable, so a
 * keyboard or screen reader user still reaches the reason, but it never opens and has
 * no options or change handler, since typeahead on a closed Radix trigger still selects.
 */
export default function UnavailableStoreSelect({
  label,
  reason,
  describedById,
  disabled,
  className,
}: IUnavailableStoreSelectProps) {
  const reasonId = useId();

  return (
    <Select open={false} disabled={disabled}>
      <SelectTrigger
        aria-disabled="true"
        aria-describedby={describedById ?? reasonId}
        className={cn(
          "min-w-0 text-xs text-placeholder sm:text-sm aria-disabled:cursor-not-allowed",
          className,
        )}
      >
        <span className="line-clamp-1 text-left">{label}</span>
      </SelectTrigger>

      {!describedById && (
        <span id={reasonId} className="sr-only">
          {reason}
        </span>
      )}
    </Select>
  );
}
