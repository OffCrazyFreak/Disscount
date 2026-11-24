import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";

interface IComingSoonBadgeProps {
  /** So a control it labels can reference it with aria-describedby */
  id?: string;
  className?: string;
}

export default function ComingSoonBadge({
  id,
  className,
}: IComingSoonBadgeProps) {
  const t = useTranslations("common");

  return (
    <Badge id={id} className={className}>
      {t("comingSoon.badge")}
    </Badge>
  );
}
