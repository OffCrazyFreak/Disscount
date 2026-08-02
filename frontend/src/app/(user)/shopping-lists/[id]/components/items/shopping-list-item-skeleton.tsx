import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface IShoppingListItemSkeletonProps {
  showSeparator?: boolean;
}

/** Mirrors ShoppingListItem: checkbox, name, then the amount and price cluster. */
export default function ShoppingListItemSkeleton({
  showSeparator = true,
}: IShoppingListItemSkeletonProps) {
  return (
    <>
      <div className="relative flex flex-wrap items-center justify-between gap-6 py-1 sm:flex-nowrap">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Skeleton aria-hidden="true" className="size-4 shrink-0 rounded-sm" />

          <div className="flex-1 text-sm sm:text-md">
            <Skeleton aria-hidden="true" className="h-[1lh] w-40 max-w-full" />
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
          <Skeleton aria-hidden="true" className="h-9 w-24 rounded-md" />
          <Skeleton aria-hidden="true" className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {showSeparator && <Separator className="my-1" />}
    </>
  );
}
