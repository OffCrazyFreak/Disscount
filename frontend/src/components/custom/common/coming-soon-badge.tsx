import { Badge } from "@/components/ui/badge";

interface IComingSoonBadgeProps {
  className?: string;
}

export default function ComingSoonBadge({ className }: IComingSoonBadgeProps) {
  return <Badge className={className}>USKORO</Badge>;
}
