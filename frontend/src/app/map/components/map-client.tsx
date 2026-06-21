"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { MapPinned } from "lucide-react";

import SearchBar from "@/components/custom/search-bar";
import SearchBarSkeleton from "@/components/custom/search-bar-skeleton";
import ComingSoon from "@/components/custom/coming-soon";

export default function MapClient({ query }: { query: string }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
        <SearchBar
          placeholder="Pretraži po nazivu trgovine ili adresi..."
          searchRoute={pathname}
          clearable={true}
          submitButtonLocation="none"
          autoSearch={true}
        />
      </Suspense>

      <div className="flex items-center justify-between gap-4">
        <h3>
          {query.length > 0
            ? `Rezultati pretrage za "${query}"`
            : "Karta i radno vrijeme trgovina"}
        </h3>
      </div>

      <ComingSoon
        icon={<MapPinned className="size-12 text-primary" />}
        description="Pretraživanje trgovina po nazivu lanca ili adresi te pregled njihovog radnog vremena na interaktivnoj karti uskoro će biti dostupni."
      />
    </div>
  );
}
