import { Skeleton } from "@/components/ui/skeleton";

export default function PriceSkeleton() {
  return (
    <Skeleton
      aria-hidden="true"
      className="inline-block h-4 w-14 align-middle motion-reduce:animate-none"
    />
  );
}
