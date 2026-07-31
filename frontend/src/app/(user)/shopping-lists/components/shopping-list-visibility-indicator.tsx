import { Globe, Lock, ShoppingCart } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LinkAccess } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface IShoppingListVisibilityIndicatorProps {
  linkAccess: LinkAccess | null | undefined;
  className?: string;
}

// Absent link access means the list is not shared. Non-owners are sent null on purpose,
// so they see the private icon rather than a level they cannot change.
const VISIBILITY = {
  NONE: {
    label: "Popis je privatan",
    icon: Lock,
    className: "text-muted-foreground",
  },
  VIEW: {
    label: "Svatko s poveznicom može vidjeti popis",
    icon: Globe,
    className: "text-primary",
  },
  SHOP: {
    label: "Svatko s poveznicom može označavati stavke",
    icon: ShoppingCart,
    className: "text-primary",
  },
  EDIT: {
    label: "Svatko s poveznicom može uređivati popis",
    icon: Globe,
    className: "text-primary",
  },
} as const;

export default function ShoppingListVisibilityIndicator({
  linkAccess,
  className,
}: IShoppingListVisibilityIndicatorProps) {
  const {
    label,
    icon: Icon,
    className: iconClassName,
  } = VISIBILITY[linkAccess ?? "NONE"];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn("inline-flex shrink-0", className)}
          tabIndex={0}
          role="img"
          aria-label={label}
        >
          <Icon className={cn("size-6", iconClassName)} aria-hidden="true" />
        </span>
      </TooltipTrigger>

      <TooltipContent className="px-2 py-1 text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}
