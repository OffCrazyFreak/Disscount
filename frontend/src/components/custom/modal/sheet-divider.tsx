import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * Wears the drawer's grab handle, so a divider inside a sheet reads as part of
 * the same chrome instead of as a hairline that the translucent background
 * swallows. Separator's own height carries a data-orientation variant, which
 * outranks a plain height class, so the override has to carry it too.
 */
const DIVIDER_CLASS =
  "rounded-full bg-muted-foreground/40 data-[orientation=horizontal]:h-0.5";

interface ISheetDividerProps {
  className?: string;
}

export default function SheetDivider({ className }: ISheetDividerProps) {
  return <Separator className={cn(DIVIDER_CLASS, className)} />;
}
