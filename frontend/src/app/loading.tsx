import PageShellSkeleton from "@/components/custom/skeleton/page-shell-skeleton";

/**
 * The last-resort route fallback, for segments with no loading.tsx of their own.
 * A neutral shape beats a centred spinner: the page keeps its height, so content
 * does not shove the viewport when it arrives.
 */
export default function Loading() {
  return <PageShellSkeleton />;
}
