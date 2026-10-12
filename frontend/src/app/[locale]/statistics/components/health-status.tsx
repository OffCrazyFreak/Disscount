"use client";

import { useTranslations } from "next-intl";

import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import cijeneService from "@/lib/cijene-api";

export default function HealthStatus() {
  const t = useTranslations("statistics");
  const {
    data: health,
    isLoading: healthLoading,
    error,
  } = cijeneService.useHealthCheck();

  if (healthLoading) {
    return (
      <div className="flex items-center gap-2">
        <BlockLoadingSpinner size={16} />
        {t("health.checking")}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-700">{t("health.error")}</div>;
  }

  return health ? (
    <div className="text-green-600" aria-live="polite">
      {t("health.available")}
    </div>
  ) : (
    <div className="text-red-700">{t("health.unavailable")}</div>
  );
}
