"use client";

import { ReactNode } from "react";
import { Construction } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";

interface IComingSoonProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export default function ComingSoon({
  title,
  description,
  icon,
}: IComingSoonProps) {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      {title && <h1 className="text-3xl font-bold">{title}</h1>}

      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-16 px-6 text-center">
        {icon ?? <Construction className="size-12 text-primary" />}

        <Badge className="text-xs">{t("common.comingSoonBadge")}</Badge>

        <p className="max-w-md text-pretty text-muted-foreground">
          {description ?? t("comingSoon.defaultDescription")}
        </p>
      </div>
    </div>
  );
}
