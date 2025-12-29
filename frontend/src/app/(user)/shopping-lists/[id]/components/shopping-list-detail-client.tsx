"use client";

import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button-icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ShoppingListModal from "@/app/(user)/shopping-lists/components/forms/shopping-list-modal";
import { useQueryClient } from "@tanstack/react-query";
import ShoppingListStoreSummary from "./shopping-list-stores-list";
import ShoppingListHeader from "@/app/(user)/shopping-lists/[id]/components/shopping-list-header";
import ShoppingListItems from "@/app/(user)/shopping-lists/[id]/components/shopping-list-items";
import DeleteListDialog from "@/app/(user)/shopping-lists/components/forms/delete-shopping-list-dialog";
import { useShoppingListData } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-data";
import { useShoppingListMutations } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-mutations";
import { shoppingListService } from "@/lib/api";
import type {
  ShoppingListRequest,
  ShoppingListItemRequest,
} from "@/lib/api/types";
import { toast } from "sonner";

interface ShoppingListDetailClientProps {
  listId: string;
}

export default function ShoppingListDetailClient({
  listId,
}: ShoppingListDetailClientProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Use custom hooks for data and mutations
  const {
    shoppingList,
    isLoading,
    error,
    cheapestStores,
    averagePrices,
    storePrices,
    totalSavings,
    savingsPercentage,
  } = useShoppingListData(listId);

  const {
    deleteShoppingListMutation,
    confirmDelete,
    handleItemUpdate,
    handleDeleteItem,
    deletingItemId,
  } = useShoppingListMutations(listId, averagePrices, storePrices);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center py-12">
          <Loader2 className="size-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Dohvaćanje popisa za kupnju...</p>
        </div>
      </div>
    );
  }

  if (error || !shoppingList) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-700 mb-4">
            <h3 className="text-lg font-semibold mb-2">Greška</h3>
            <p>Popis za kupnju nije pronađen ili se dogodila greška.</p>
          </div>
          <Link href="/shopping-lists">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Natrag na popise za kupnju
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleModalSuccess = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["shoppingLists", listId],
    });
  };

  const handleConfirmDelete = () => {
    confirmDelete();
    setIsDeleteDialogOpen(false);
  };

  const handleCopy = async () => {
    if (!shoppingList) return;

    setIsCopying(true);
    try {
      // Create new shopping list with copied title
      const newListData: ShoppingListRequest = {
        title: `${shoppingList.title} (Kopija)`,
        isPublic: false,
      };

      const newList = await shoppingListService.createShoppingList(newListData);

      // Copy items with only the necessary fields
      if (shoppingList.items && shoppingList.items.length > 0) {
        const copyPromises = shoppingList.items.map((item) => {
          const newItemData: ShoppingListItemRequest = {
            ean: item.ean,
            name: item.name,
            brand: item.brand,
            quantity: item.quantity,
            unit: item.unit,
            amount: item.amount,
            // Default values (not copying these from original)
            isChecked: false,
            chainCode: null,
            avgPrice: null,
            storePrice: null,
          };

          return shoppingListService.addItemToShoppingList(
            newList.id,
            newItemData
          );
        });

        await Promise.all(copyPromises);
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({
        queryKey: ["shoppingLists"],
      });

      // Show success toast
      toast.success("Popis za kupnju je uspješno kopiran!");

      // Navigate to new shopping list
      router.push(`/shopping-lists/${newList.id}`);
    } catch (error) {
      console.error("Error copying shopping list:", error);
      toast.error("Greška pri kopiranju popisa za kupnju");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header Section */}
      <section>
        <ShoppingListHeader
          shoppingList={shoppingList}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCopy={handleCopy}
          isDeleting={deleteShoppingListMutation.isPending}
          isCopying={isCopying}
          totalSavings={totalSavings}
          savingsPercentage={savingsPercentage}
        />
      </section>

      {/* Shopping List Items Section */}
      <section>
        <ShoppingListItems
          shoppingList={shoppingList}
          onItemUpdate={handleItemUpdate}
          onDeleteItem={handleDeleteItem}
          deletingItemId={deletingItemId}
          cheapestStores={cheapestStores}
          averagePrices={averagePrices}
          storePrices={storePrices}
        />
      </section>

      {/* Store Summary Section */}
      <section>
        <ShoppingListStoreSummary shoppingList={shoppingList} />
      </section>

      <ShoppingListModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleModalSuccess}
        shoppingList={shoppingList}
      />

      <DeleteListDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteShoppingListMutation.isPending}
        listTitle={shoppingList.title}
      />
    </div>
  );
}
