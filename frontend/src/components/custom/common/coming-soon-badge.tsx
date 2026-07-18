import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface IComingSoonBadgeProps {
  className?: string;
}

export default function ComingSoonBadge({ className }: IComingSoonBadgeProps) {
  return <Badge className={cn("text-[10px]", className)}>USKORO</Badge>;
}
