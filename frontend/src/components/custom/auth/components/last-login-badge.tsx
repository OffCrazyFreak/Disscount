import { CircleCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type LastLoginVariant = "solid" | "inverse";

interface ILastLoginBadgeProps {
  variant?: LastLoginVariant;
}

const variantStyles: Record<LastLoginVariant, string> = {
  solid: "bg-primary text-white",
  inverse: "bg-white text-primary",
};

export default function LastLoginBadge({
  variant = "solid",
}: ILastLoginBadgeProps) {
  return (
    <Badge
      className={cn(
        "absolute -top-2.5 sm:-top-3.5 right-1 sm:right-4",
        variantStyles[variant],
      )}
    >
      <CircleCheck size={12} />
      Zadnja prijava
    </Badge>
  );
}
