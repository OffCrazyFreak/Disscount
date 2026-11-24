"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";

interface INoResultsProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export default function NoResults({
  icon,
  title,
  description,
  className = "",
}: INoResultsProps) {
  const t = useTranslations("common");

  return (
    <div className={`text-center py-12 ${className}`}>
      {icon}
      <h3 className="text-lg font-semibold text-foreground mb-2 text-pretty">
        {title ?? t("noResults.title")}
      </h3>
      <p className="text-gray-600">
        {description ?? t("noResults.description")}
      </p>
    </div>
  );
}
