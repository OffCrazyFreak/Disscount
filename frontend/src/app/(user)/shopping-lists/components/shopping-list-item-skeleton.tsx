import { Calendar, ListChecks } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors ShoppingListListItem. The metadata icons are fixed, so they render for
 * real and only their values are placeholders.
 */
export default function ShoppingListItemSkeleton() {
  return (
    <Card className="relative p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-3 sm:flex sm:gap-4">
        <div className="min-w-0 text-lg font-bold sm:flex-1">
          <Skeleton aria-hidden="true" className="h-[1lh] w-48 max-w-full" />
        </div>

        <div className="flex items-center gap-1 sm:hidden">
          <Skeleton aria-hidden="true" className="size-9 rounded-md" />
        </div>

        <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:justify-start sm:gap-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar aria-hidden="true" className="size-5" />
            <Skeleton aria-hidden="true" className="h-[1lh] w-20" />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ListChecks aria-hidden="true" className="size-5" />
            <Skeleton aria-hidden="true" className="h-[1lh] w-10" />
          </div>
        </div>

        <div className="hidden items-center gap-1 sm:flex sm:gap-2">
          <Skeleton aria-hidden="true" className="size-9 rounded-md" />
          <Skeleton aria-hidden="true" className="size-9 rounded-md" />
        </div>
      </div>
    </Card>
  );
}
