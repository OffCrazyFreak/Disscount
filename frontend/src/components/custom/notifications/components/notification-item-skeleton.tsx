import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors NotificationItem: product name, brand, then its discounted stores. */
export default function NotificationItemSkeleton() {
  return (
    <div className="block p-4 border-b last:border-b-0">
      <div className="flex flex-col gap-2">
        <div className="space-y-1">
          <div className="text-sm">
            <Skeleton aria-hidden="true" className="h-[1lh] w-44 max-w-full" />
          </div>

          <div className="text-xs">
            <Skeleton aria-hidden="true" className="h-[1lh] w-24" />
          </div>
        </div>

        <Skeleton aria-hidden="true" className="h-5 w-36 rounded-md" />
      </div>
    </div>
  );
}
