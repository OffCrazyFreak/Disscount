import {
  ArrowLeft,
  Calendar,
  Globe,
  Lock,
  LucideClipboardEdit,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button-icon";
import Link from "next/link";
import { formatDate } from "@/utils/strings";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";

interface ShoppingListHeaderProps {
  shoppingList: ShoppingList;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  totalSavings: number;
  savingsPercentage: number;
}

export default function ShoppingListHeader({
  shoppingList,
  onEdit,
  onDelete,
  isDeleting,
  totalSavings,
  savingsPercentage,
}: ShoppingListHeaderProps) {
  const itemCount = shoppingList.items?.length || 0;
  const checkedCount =
    shoppingList.items?.filter((item) => item.isChecked)?.length || 0;

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Link href="/shopping-lists">
            <Button variant="ghost" className="size-10">
              <ArrowLeft className="size-6" />
            </Button>
          </Link>

          <h1 className="text-2xl font-bold">{shoppingList.title}</h1>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div
            title={
              shoppingList.isPublic ? "Popis je javan" : "Popis je privatan"
            }
            className="mr-2"
          >
            {shoppingList.isPublic ? (
              <Globe className="h-5 w-5 text-green-600" />
            ) : (
              <Lock className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <Button
            size="icon"
            variant="default"
            className="p-2 size-12 shrink-0"
            onClick={onEdit}
            title="Uredi popis"
          >
            <LucideClipboardEdit className="size-6" />
          </Button>

          <Button
            size="icon"
            variant="default"
            className="p-2 size-12 shrink-0 bg-red-600 hover:bg-red-700"
            onClick={onDelete}
            title="Obriši popis"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <Trash2 className="size-6" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Stvorena: {formatDate(shoppingList.createdAt)}</span>
          </div>

          <div>
            {itemCount} stavki ({checkedCount} završeno)
          </div>
        </div>

        {/* Savings Summary */}
        {checkedCount > 0 && totalSavings > 0 && (
          <div className="flex items-center justify-center gap-2 text-green-600 text-lg font-semibold">
            {savingsPercentage.toFixed(1)}% / {totalSavings.toFixed(2)}€
          </div>
        )}
      </div>
    </div>
  );
}
