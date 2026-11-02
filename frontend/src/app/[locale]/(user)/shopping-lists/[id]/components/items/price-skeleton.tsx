import { Skeleton } from "@/components/ui/skeleton";

/** Stands in for a row's approximate or per unit price while its lookup loads. */
export default function PriceSkeleton() {
  return (
    <Skeleton
      aria-hidden="true"
      className="inline-block h-4 w-14 align-middle motion-reduce:animate-none"
    />
  );
}
