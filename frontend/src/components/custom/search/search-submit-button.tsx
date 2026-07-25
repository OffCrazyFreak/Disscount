import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ISearchSubmitButtonProps {
  label: string;
  block?: boolean;
  disabled?: boolean;
  /** Associates the button with a form it sits outside of, in the sheet's footer */
  form?: string;
}

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
