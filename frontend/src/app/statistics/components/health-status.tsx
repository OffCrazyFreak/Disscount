"use client";

import cijeneService from "@/lib/cijene-api";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataPending } from "@/lib/query/use-data-pending";

export default function HealthStatus() {
  const { data: health, isPending, error } = cijeneService.useHealthCheck();

  const pending = useDataPending(isPending);

  if (pending) {
    return (
      <>
        <span className="sr-only" role="status">
          Provjera stanja
        </span>
        <Skeleton aria-hidden="true" className="h-[1lh] w-52" />
      </>
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
