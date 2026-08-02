import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors ShoppingListHeader. The back link is real, since it works without the
 * list having loaded and is the way out if this page never resolves.
 */
export default function ShoppingListHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-0 sm:gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link
              href="/shopping-lists"
              aria-label="Natrag na popise za kupnju"
            >
              <ChevronLeft aria-hidden="true" />
            </Link>
          </Button>

          <div className="min-w-0 flex-1 text-xl font-bold sm:text-2xl">
            <Skeleton aria-hidden="true" className="h-[1lh] w-56 max-w-full" />
          </div>
        </div>

        {/* Actions need the list to act on, so they are placeholders here. */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Skeleton aria-hidden="true" className="size-9 rounded-md" />
          <Skeleton aria-hidden="true" className="size-9 rounded-md" />
        </div>
      </div>
    </div>
  );
}
