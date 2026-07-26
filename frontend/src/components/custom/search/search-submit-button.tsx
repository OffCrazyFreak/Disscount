import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ISearchSubmitButtonProps {
  label: string;
  /** Full width and stacked, rather than sharing a row with the field */
  block?: boolean;
  disabled?: boolean;
  /**
   * The form to submit, for a button rendered outside it. An owning `form`
   * attribute also makes it that form's default button, so Enter in the field
   * keeps working from wherever the button sits.
   */
  form?: string;
}

/** The Pretraži button, shared by the inline bars and the products sheet's footer. */
export default function SearchSubmitButton({
  label,
  block = false,
  disabled = false,
  form,
}: ISearchSubmitButtonProps) {
  return (
    <Button
      type="submit"
      form={form}
      size="lg"
      effect="shineHover"
      disabled={disabled}
      className={cn("grow p-6 text-lg hover:bg-secondary", block && "w-full")}
    >
      <Search className="size-5" />
      {label}
    </Button>
  );
}
