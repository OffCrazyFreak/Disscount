"use client";

import { ChevronsUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useScrolledPast } from "@/hooks/use-scrolled-past";
import { BACK_TO_TOP_THRESHOLD_PX, scrollToTop } from "@/utils/scroll";

/** Full width and stacked, rather than sharing a row with the field */
const BASE_CLASS = "grow px-6 text-lg hover:bg-secondary";

interface ISearchActionButtonProps {
  label: string;
  block?: boolean;
  disabled?: boolean;
  /** True when submitting this query would leave the page exactly as it is */
  isUnchanged: boolean;
  /**
   * The form to submit, for a button rendered outside it. An owning `form`
   * attribute also makes it that form's default button, so Enter in the field
   * keeps working from wherever the button sits.
   */
  form?: string;
}

/**
 * The one loud action under a search field.
 *
 * With something new typed it submits. With nothing to submit on a scrolled
 * page it returns you to the top instead, since a disabled Pretraži is a whole
 * button's worth of space saying no. Unscrolled it falls back to the disabled
 * state, which is honest: there is nowhere to go and nothing to search.
 */
export default function SearchActionButton({
  label,
  block = false,
  disabled = false,
  isUnchanged,
  form,
}: ISearchActionButtonProps) {
  const canReturn = useScrolledPast(BACK_TO_TOP_THRESHOLD_PX);

  if (!disabled && isUnchanged && canReturn) {
    return (
      <Button
        type="button"
        size="lg"
        effect="shineHover"
        onClick={scrollToTop}
        className={cn(BASE_CLASS, block && "w-full")}
      >
        <ChevronsUp className="size-5" />
        Natrag na vrh
      </Button>
    );
  }

  return (
    <Button
      type="submit"
      form={form}
      size="lg"
      effect="shineHover"
      disabled={disabled || isUnchanged}
      className={cn(BASE_CLASS, block && "w-full")}
    >
      <Search className="size-5" />
      {label}
    </Button>
  );
}
