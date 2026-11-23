import type { ComponentProps, MouseEventHandler, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IShoppingListIconActionProps {
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  tooltipVariant?: ComponentProps<typeof TooltipContent>["variant"];
}

export default function ShoppingListIconAction({
  label,
  onClick,
  children,
  className,
  disabled,
  tooltipVariant,
}: IShoppingListIconActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          aria-label={label}
          className={cn("shrink-0", className)}
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </Button>
      </TooltipTrigger>

      <TooltipContent variant={tooltipVariant} className="px-2 py-1 text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
