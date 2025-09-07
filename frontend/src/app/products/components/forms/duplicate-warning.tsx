import { TriangleAlert } from "lucide-react";

interface DuplicateWarningProps {
  hasDuplicateEan: boolean;
  selectedListId: string;
  duplicateItem:
    | {
        amount: number;
      }
    | undefined;
}

export default function DuplicateWarning({
  hasDuplicateEan,
  selectedListId,
  duplicateItem,
}: DuplicateWarningProps) {
  if (!hasDuplicateEan || selectedListId === "new" || !duplicateItem) {
    return null;
  }

  return (
    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-center gap-4">
        <TriangleAlert className="size-10 shrink-0 text-amber-600" />

        <div className="space-y-1">
          <h4 className="text-sm text-amber-600">
            Proizvod već u popisu za kupnju
          </h4>
          <p className="text-xs text-amber-900 text-justify">
            Ovaj proizvod je već dodan u odabran popis za kupnju. Dodavanjem
            ovog proizvoda će se samo povećati njegova količina u popisu za
            kupnju ({duplicateItem.amount}) kom.
          </p>
        </div>
      </div>
    </div>
  );
}
