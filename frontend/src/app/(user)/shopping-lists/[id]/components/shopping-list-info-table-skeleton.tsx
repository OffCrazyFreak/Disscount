import { Skeleton } from "@/components/ui/skeleton";

const ROWS = [
  ["Stvoreno:", "Ažurirano:"],
  ["Ukupno:", "Preostalo:"],
  ["Potrošeno:", "Ušteđeno:"],
] as const;

/**
 * Mirrors ShoppingListInfoTable. The labels are fixed copy, so they render for
 * real and only the values are placeholders, which keeps the table exactly as
 * tall as it will be once the numbers land.
 */
export default function ShoppingListInfoTableSkeleton() {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-background shadow-2xs">
      <table className="w-full text-sm">
        <tbody>
          {ROWS.map(([left, right], index) => (
            <tr
              key={left}
              className={
                index === 1
                  ? "flex flex-col sm:table-row border-y"
                  : "flex flex-col sm:table-row"
              }
            >
              <td className="p-2 whitespace-nowrap border-b sm:border-b-0 sm:border-r">
                <span className="font-bold">{left} </span>
                <Skeleton
                  aria-hidden="true"
                  className="inline-block h-[1em] w-24 translate-y-[0.15em] align-baseline"
                />
              </td>

              <td className="p-2 whitespace-nowrap">
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
  );
}
