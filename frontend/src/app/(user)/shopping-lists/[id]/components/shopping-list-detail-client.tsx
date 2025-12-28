"use client";

import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button-icon";
import Link from "next/link";
import ShoppingListModal from "@/app/(user)/shopping-lists/components/forms/shopping-list-modal";
import { useQueryClient } from "@tanstack/react-query";
import ShoppingListStoreSummary from "./shopping-list-stores-list";
import ShoppingListHeader from "@/app/(user)/shopping-lists/[id]/components/shopping-list-header";
import ShoppingListItems from "@/app/(user)/shopping-lists/[id]/components/shopping-list-items";
import DeleteListDialog from "@/app/(user)/shopping-lists/[id]/components/delete-list-dialog";
import { useShoppingListData } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-data";
import { useShoppingListMutations } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-mutations";

interface ShoppingListDetailClientProps {
  listId: string;
}

export default function ShoppingListDetailClient({
  listId,
}: ShoppingListDetailClientProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header Section */}
      <section>
        <ShoppingListHeader
          shoppingList={shoppingList}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeleting={deleteShoppingListMutation.isPending}
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
