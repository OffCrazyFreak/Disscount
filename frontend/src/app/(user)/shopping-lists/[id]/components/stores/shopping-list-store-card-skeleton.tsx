import { Card, CardHeader } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the collapsed header of ShoppingListStoreItem: logo, name, prices. */
export default function ShoppingListStoreCardSkeleton() {
  return (
    <Card className="shadow-sm py-0">
      <CardHeader className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton
            aria-hidden="true"
            className="flex-shrink-0 size-12 sm:size-16 rounded-sm"
          />

          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton aria-hidden="true" className="h-[1lh] w-32" />
            <Skeleton aria-hidden="true" className="h-[1lh] w-44 max-w-full" />
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
