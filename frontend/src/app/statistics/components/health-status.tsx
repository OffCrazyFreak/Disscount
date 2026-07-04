"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import cijeneService from "@/lib/cijene-api";

export default function HealthStatus() {
  const t = useTranslations("pages.statistics");
  const {
    data: health,
    isLoading: healthLoading,
    error,
  } = cijeneService.useHealthCheck();

  if (healthLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" />
        {t("checking")}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-700">❌ {t("apiCheckError")}</div>;
  }

  return health ? (
    <div className="text-green-600" aria-live="polite">
      ✅ {t("apiAvailable")}
    </div>
  ) : (
    <div className="text-red-700">❌ {t("apiUnavailable")}</div>
  );
}
