import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** Separator's height carries a data-orientation variant that outranks a plain height class, so the override carries it too. */
const DIVIDER_CLASS =
  "rounded-full bg-muted-foreground/40 data-[orientation=horizontal]:h-0.5";

interface ISheetDividerProps {
  className?: string;
}

export default function SheetDivider({ className }: ISheetDividerProps) {
  return <Separator className={cn(DIVIDER_CLASS, className)} />;
}
