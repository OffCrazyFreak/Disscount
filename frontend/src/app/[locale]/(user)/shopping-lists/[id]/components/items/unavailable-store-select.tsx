import { useId } from "react";

import { Select, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface IUnavailableStoreSelectProps {
  /** What the trigger shows: the reason, with the saved store in front when there is one. */
  label: string;
  reason: string;
  /** Ids of fuller explanations elsewhere, read before the reason. */
  describedById?: string;
  /** False when a banner it points at already says the same thing. */
  isReasonDescribed: boolean;
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
  isReasonDescribed,
  className,
}: IUnavailableStoreSelectProps) {
  const reasonId = useId();

  return (
    <Select open={false}>
      <SelectTrigger
        aria-disabled="true"
        aria-describedby={
          [describedById, isReasonDescribed && reasonId]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={cn(
          "min-w-0 text-xs text-placeholder sm:text-sm aria-disabled:cursor-not-allowed",
          className,
        )}
      >
        <span className="line-clamp-1 text-left">{label}</span>
      </SelectTrigger>

      {isReasonDescribed && (
        <span id={reasonId} className="sr-only">
          {reason}
        </span>
      )}
    </Select>
  );
}
