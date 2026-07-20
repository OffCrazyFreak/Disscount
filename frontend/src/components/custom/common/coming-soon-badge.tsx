import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface IComingSoonBadgeProps {
  className?: string;
}

export default function ComingSoonBadge({ className }: IComingSoonBadgeProps) {
  return (
    <Badge className={cn("sm:shadow-sm text-[10px] sm:text-xs", className)}>
      USKORO
    </Badge>
  );
}
