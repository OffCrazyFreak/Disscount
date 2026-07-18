"use client";

import BlockLoadingSpinner from "@/components/custom/block-loading-spinner";
import cijeneService from "@/lib/cijene-api";

export default function HealthStatus() {
  const {
    data: health,
    isLoading: healthLoading,
    error,
  } = cijeneService.useHealthCheck();

  if (healthLoading) {
    return (
      <div className="flex items-center gap-2">
        <BlockLoadingSpinner size={16} />
        Provjera stanja...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-700">
        ❌ Greška pri provjeri dostupnosti API-ja
      </div>
    );
  }

  return health ? (
    <div className="text-green-600" aria-live="polite">
      ✅ Cijene API je dostupan
    </div>
  ) : (
    <div className="text-red-700">❌ Cijene API nije dostupan</div>
  );
}
