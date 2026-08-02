import { ChevronDown } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the collapsed header of StoreItem: chain logo, name, price row. */
export default function StoreItemSkeleton() {
  return (
    <Card className="shadow-sm py-0">
      <CardHeader className="flex items-center justify-between gap-4 py-4">
        <div className="flex min-w-0 items-center gap-4">
          <Skeleton
            aria-hidden="true"
            className="flex-shrink-0 size-12 sm:size-16 rounded-sm"
          />

          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton aria-hidden="true" className="h-[1lh] w-28" />
            <Skeleton aria-hidden="true" className="h-[1lh] w-40 max-w-full" />
          </div>
        </div>

        <ChevronDown
          aria-hidden="true"
          className="size-8 text-gray-500 flex-shrink-0"
        />
      </CardHeader>
    </Card>
  );
}
