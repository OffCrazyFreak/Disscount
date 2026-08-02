import { Skeleton } from "@/components/ui/skeleton";

const TABLE_LABELS = [
  ["Proizvođač:", "Bar kod:"],
  ["Količina:", "Cijene:"],
  ["Jedinična cijena:", "Kategorija:"],
] as const;

/**
 * Mirrors ProductInfoDisplay: the name row plus the info table beneath it. The
 * table's labels are fixed copy and render for real, so only the values move.
 */
export default function ProductInfoDisplaySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-4">
          <Skeleton aria-hidden="true" className="size-9 shrink-0 rounded-md" />

          <div className="min-w-0 flex-1">
            <div className="font-bold">
              <Skeleton
                aria-hidden="true"
                className="h-[1lh] w-56 max-w-full"
              />
            </div>

            <div className="text-sm">
              <Skeleton
                aria-hidden="true"
                className="mt-1 h-[1lh] w-32 max-w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Skeleton aria-hidden="true" className="size-9 rounded-md" />
          <Skeleton aria-hidden="true" className="size-9 rounded-md" />
          <Skeleton aria-hidden="true" className="size-9 rounded-md" />
        </div>
      </div>

      <div className="border border-gray-300 rounded-lg overflow-hidden bg-background shadow-2xs">
        <table className="w-full text-sm table-fixed">
          <tbody>
            {TABLE_LABELS.map(([left, right], index) => (
              <tr
                key={left}
                className={
                  index === 1
                    ? "flex flex-col sm:table-row border-y"
                    : "flex flex-col sm:table-row"
                }
              >
                <td className="p-2 border-b sm:border-b-0 sm:border-r flex-1">
                  <span className="font-bold">{left} </span>
                  <Skeleton
                    aria-hidden="true"
                    className="inline-block h-[1em] w-24 translate-y-[0.15em] align-baseline"
                  />
                </td>

                <td className="p-2 flex-1">
                  <span className="font-bold">{right} </span>
                  <Skeleton
                    aria-hidden="true"
                    className="inline-block h-[1em] w-24 translate-y-[0.15em] align-baseline"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
