"use client";

import { useState } from "react";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Globe,
  Lock,
  LucideClipboardEdit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button-icon";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { shoppingListService } from "@/lib/api";
import { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import { formatDate } from "@/utils/strings";
import ShoppingListModal from "@/app/(user)/shopping-lists/components/forms/shopping-list-modal";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ShoppingListDetailClient({
  listId,
}: {
  listId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    data: shoppingList,
    isLoading,
    error,
  } = shoppingListService.useGetShoppingListById(listId);

  const deleteShoppingListMutation =
    shoppingListService.useDeleteShoppingList();

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

  const itemCount = shoppingList.items?.length || 0;
  const checkedCount =
    shoppingList.items?.filter((item) => item.isChecked)?.length || 0;

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    // Prepare optimistic update: remove item from cache immediately
    await queryClient.cancelQueries({ queryKey: ["shoppingLists", "me"] });
    const previous = queryClient.getQueryData<ShoppingList[]>([
      "shoppingLists",
      "me",
    ]);
    queryClient.setQueryData<ShoppingList[] | undefined>(
      ["shoppingLists", "me"],
      (old: ShoppingList[] | undefined) =>
        old ? old.filter((l) => l.id !== listId) : []
    );
    const deletedItem: ShoppingList | undefined = previous?.find(
      (l) => l.id === listId
    );

    // Fire the delete request. Keep dialog open while mutation is in-flight so
    // the user sees the loading state; only navigate after success.
    deleteShoppingListMutation.mutate(listId, {
      onError: (error: Error) => {
        // Rollback cache so UI reflects server state
        if (previous) {
          queryClient.setQueryData(["shoppingLists", "me"], previous);
        }
        // Show descriptive error and keep the user on the detail page so they
        // can retry or see the error context.
        toast.error(
          error.message ||
            "Greška pri brisanju popisa za kupnju. Pokušajte ponovno."
        );
      },
      onSuccess: () => {
        // On success: close dialog, show confirmation, invalidate and navigate
        toast.success("Popis za kupnju je uspješno obrisan!");
        setIsDeleteDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ["shoppingLists", "me"] });
        router.push("/shopping-lists");
      },
      onSettled: () => {
        // Make sure cache is refreshed after attempt (non-blocking)
        queryClient.invalidateQueries({ queryKey: ["shoppingLists", "me"] });
      },
    });
  };

  const handleModalSuccess = async () => {
    // Refetch the shopping list data
    await queryClient.invalidateQueries({
      queryKey: ["shoppingLists", listId],
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/shopping-lists">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Natrag na popise za kupnju
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">{shoppingList.title}</h1>
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
              variant="ghost"
              className="size-10"
              onClick={handleEdit}
              title="Uredi popis"
            >
              <LucideClipboardEdit className="size-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-10 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              title="Obriši popis"
              disabled={deleteShoppingListMutation.isPending}
            >
              {deleteShoppingListMutation.isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Trash2 className="size-5" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Stvorena: {formatDate(shoppingList.createdAt)}</span>
          </div>
          <div>
            {itemCount} stavki ({checkedCount} završeno)
          </div>
        </div>
      </div>

      {/* AI Prompt */}
      {shoppingList.aiPrompt && (
        <Card className="p-4 mb-6 bg-purple-50 border-purple-200">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">AI Prompt:</h3>
              <p className="text-purple-800">{shoppingList.aiPrompt}</p>
              {shoppingList.aiAnswer && (
                <div className="mt-3 pt-3 border-t border-purple-300">
                  <h4 className="font-medium text-purple-900 mb-1">
                    AI Odgovor:
                  </h4>
                  <p className="text-purple-700 text-sm">
                    {shoppingList.aiAnswer}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Items */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Stavke ({itemCount})</h2>

        {itemCount === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">Ovaj popis još nema stavki.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {shoppingList.items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        item.isChecked
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {item.isChecked && "✓"}
                    </div>
                    <div>
                      <p
                        className={`font-medium ${
                          item.isChecked ? "line-through text-gray-500" : ""
                        }`}
                      >
                        {item.name}
                      </p>
                      {item.amount && (
                        <p className="text-sm text-gray-600">
                          Količina: {item.amount}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(item.createdAt)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ShoppingListModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleModalSuccess}
        shoppingList={shoppingList}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Obriši popis za kupnju</DialogTitle>
            <DialogDescription>
              Jeste li sigurni da želite obrisati popis "{shoppingList.title}"?
              Ova akcija se ne može poništiti.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Odustani
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteShoppingListMutation.isPending}
            >
              {deleteShoppingListMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : null}
              Obriši
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
