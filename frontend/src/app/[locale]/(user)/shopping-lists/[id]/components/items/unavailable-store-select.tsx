import { useId } from "react";
import { useTranslations } from "next-intl";

import { Select, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface IUnavailableStoreSelectProps {
  /** What the trigger shows: the reason, with the saved store in front when there is one. */
  label: string;
  /** Ids of fuller explanations elsewhere, such as the list banners. */
  describedById?: string;
  className?: string;
}

/**
 * The store select of an item with no prices to compare. It stays focusable, so a
 * keyboard or screen reader user still reaches the reason, but it never opens and has
 * no options or change handler, since typeahead on a closed Radix trigger still selects.
 */
export default function UnavailableStoreSelect({
  label,
  describedById,
  className,
}: IUnavailableStoreSelectProps) {
  const t = useTranslations("products");
  const fieldNameId = useId();
  const labelId = useId();

  return (
    <Select open={false}>
      <SelectTrigger
        aria-disabled="true"
        // A combobox takes no name from its content, so name it the field plus its reason.
        aria-labelledby={`${fieldNameId} ${labelId}`}
        aria-describedby={describedById}
        className={cn(
          "min-w-0 text-xs text-muted-foreground sm:text-sm aria-disabled:cursor-not-allowed",
          className,
        )}
      >
        <span id={labelId} className="line-clamp-1 text-left">
          {label}
        </span>
      </SelectTrigger>

      <span id={fieldNameId} className="sr-only">
        {t("storeChainField.label")}
      </span>
    </Select>
  );
}
