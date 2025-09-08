"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import cijeneService from "@/lib/cijene-api";

export default function HealthStatus() {
  const { data: health, isLoading: healthLoading } =
    cijeneService.useHealthCheck();


  if (healthLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" />
        Provjera stanja...
      </div>
    );
  }

  return health ? (
    <div className="text-green-600">
      ✅ Cijene API je dostupan {health.status}
    </div>
  ) : (
    <div className="text-red-700">❌ Cijene API nije dostupan</div>
  );
}
