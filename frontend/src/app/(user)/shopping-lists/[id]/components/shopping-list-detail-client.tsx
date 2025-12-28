"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Globe,
  Lock,
  LucideClipboardEdit,
  Trash2,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button-icon";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { shoppingListService } from "@/lib/api";
import { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import { formatDate } from "@/utils/strings";
import { storeNamesMap } from "@/utils/mappings";
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
import ShoppingListStoreSummary from "./shopping-list-store-summary";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import StoreChainSelect from "./store-chain-select";
import { useUser } from "@/context/user-context";
import {
  findCheapestStoreForItem,
  getAveragePriceForItem,
  getStorePricesForItem,
} from "@/utils/shopping-list-utils";

interface ShoppingListDetailClientProps {
  listId: string;
}

export default function ShoppingListDetailClient({
  listId,
}: ShoppingListDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [cheapestStores, setCheapestStores] = useState<Record<string, string>>(
    {}
  );
  const [averagePrices, setAveragePrices] = useState<Record<string, number>>(
    {}
  );
  const [storePrices, setStorePrices] = useState<
    Record<string, Record<string, number>>
  >({});

  const {
    data: shoppingList,
    isLoading,
    error,
  } = shoppingListService.useGetShoppingListById(listId);

  // Compute cheapest stores for all items
  useEffect(() => {
    if (!shoppingList?.items || !user?.pinnedStores) return;

    const abortController = new AbortController();

    const computeCheapestStores = async () => {
      try {
        const promises = shoppingList.items.map(async (item) => {
          try {
            const cheapestStore = await findCheapestStoreForItem(
              item,
              user.pinnedStores || undefined
            );
            return { itemId: item.id, cheapestStore };
          } catch (error) {
            console.error(
              `Failed to find cheapest store for item ${item.id}:`,
              error
            );
            return { itemId: item.id, cheapestStore: null };
          }
        });

        const results = await Promise.allSettled(promises);

        if (abortController.signal.aborted) return;

        const stores: Record<string, string> = {};
        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value.cheapestStore) {
            stores[result.value.itemId] = result.value.cheapestStore;
          }
        });

        setCheapestStores(stores);
      } catch (error) {
        console.error("Error computing cheapest stores:", error);
      }
    };

    computeCheapestStores();

    return () => {
      abortController.abort();
    };
  }, [shoppingList?.items, user?.pinnedStores]);

  // Compute average prices and store prices for all items on page load
  useEffect(() => {
    if (!shoppingList?.items) return;

    const computeAveragePrices = async () => {
      const prices: Record<string, number> = {};
      const stores: Record<string, Record<string, number>> = {};

      // Fetch price data for ALL items, regardless of checked status
      // This ensures data is always available when toggling items
      for (const item of shoppingList.items) {
        const avgPrice = await getAveragePriceForItem(item);
        const itemStorePrices = await getStorePricesForItem(item);

        if (avgPrice !== null) {
          prices[item.id] = avgPrice;
        }

        if (Object.keys(itemStorePrices).length > 0) {
          stores[item.id] = itemStorePrices;
        }
      }

      setAveragePrices(prices);
      setStorePrices(stores);
    };

    computeAveragePrices();
  }, [shoppingList?.items]);

  const deleteShoppingListMutation =
    shoppingListService.useDeleteShoppingList();

  const updateItemMutation = shoppingListService.useUpdateShoppingListItem();
  const deleteItemMutation = shoppingListService.useDeleteShoppingListItem();

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

  // Calculate total savings from checked items
  const { totalSavings, totalPotentialCost } = shoppingList.items
    ?.filter((item) => item.isChecked && item.avgPrice && item.storePrice)
    .reduce(
      (acc, item) => {
        const potentialCost = item.avgPrice! * (item.amount || 1);
        const actualCost = item.storePrice! * (item.amount || 1);
        const savings = potentialCost - actualCost;

        return {
          totalSavings: acc.totalSavings + savings,
          totalPotentialCost: acc.totalPotentialCost + potentialCost,
        };
      },
      { totalSavings: 0, totalPotentialCost: 0 }
    ) || { totalSavings: 0, totalPotentialCost: 0 };

  const savingsPercentage =
    totalPotentialCost > 0 ? (totalSavings / totalPotentialCost) * 100 : 0;

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

  const handleItemCheckedChange = async (itemId: string, checked: boolean) => {
    // Find the item to update
    const item = shoppingList.items?.find((i) => i.id === itemId);
    if (!item) return;

    // Optimistic update
    await queryClient.cancelQueries({ queryKey: ["shoppingLists", listId] });
    const previousData = queryClient.getQueryData<ShoppingList>([
      "shoppingLists",
      listId,
    ]);

    queryClient.setQueryData<ShoppingList | undefined>(
      ["shoppingLists", listId],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items?.map((i) => {
            if (i.id === itemId) {
              const updatedItem = { ...i, isChecked: checked };
              // If checking the item, include the current average price
              if (checked) {
                const currentAvgPrice = averagePrices[i.id];
                if (currentAvgPrice !== undefined) {
                  updatedItem.avgPrice = currentAvgPrice;
                }
              }
              return updatedItem;
            }
            return i;
          }),
        };
      }
    );

    // Update the item - include avgPrice and storePrice when checking
    const updateData = {
      ...item,
      isChecked: checked,
    };

    // If checking the item, include the current average price and store price
    if (checked) {
      const currentAvgPrice = averagePrices[item.id];
      if (currentAvgPrice !== undefined) {
        updateData.avgPrice = currentAvgPrice;
      }

      // Include the store price from the selected store
      if (item.chainCode && storePrices[item.id]?.[item.chainCode]) {
        updateData.storePrice = storePrices[item.id][item.chainCode];
      }
    }

    updateItemMutation.mutate(
      {
        listId,
        itemId,
        data: updateData,
      },
      {
        onError: (error: Error) => {
          // Rollback on error
          if (previousData) {
            queryClient.setQueryData(["shoppingLists", listId], previousData);
          }
          toast.error(
            error.message || "Greška pri ažuriranju stavke. Pokušajte ponovno."
          );
        },
        onSettled: () => {
          queryClient.invalidateQueries({
            queryKey: ["shoppingLists", listId],
          });
          queryClient.invalidateQueries({ queryKey: ["shoppingLists", "me"] });
        },
      }
    );
  };

  const handleItemAmountChange = async (itemId: string, newAmount: number) => {
    if (newAmount < 1) return;

    // Find the item to update
    const item = shoppingList.items?.find((i) => i.id === itemId);
    if (!item) return;

    // Optimistic update
    await queryClient.cancelQueries({ queryKey: ["shoppingLists", listId] });
    const previousData = queryClient.getQueryData<ShoppingList>([
      "shoppingLists",
      listId,
    ]);

    queryClient.setQueryData<ShoppingList | undefined>(
      ["shoppingLists", listId],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items?.map((i) =>
            i.id === itemId ? { ...i, amount: newAmount } : i
          ),
        };
      }
    );

    // Update the item
    updateItemMutation.mutate(
      {
        listId,
        itemId,
        data: {
          ...item,
          amount: newAmount,
        },
      },
      {
        onError: (error: Error) => {
          // Rollback on error
          if (previousData) {
            queryClient.setQueryData(["shoppingLists", listId], previousData);
          }
          toast.error(
            error.message || "Greška pri ažuriranju stavke. Pokušajte ponovno."
          );
        },
        onSettled: () => {
          queryClient.invalidateQueries({
            queryKey: ["shoppingLists", listId],
          });
          queryClient.invalidateQueries({ queryKey: ["shoppingLists", "me"] });
        },
      }
    );
  };

  const handleStoreChainChange = async (itemId: string, chainCode: string) => {
    // Find the item to update
    const item = shoppingList.items?.find((i) => i.id === itemId);
    if (!item) return;

    // Optimistic update
    await queryClient.cancelQueries({ queryKey: ["shoppingLists", listId] });
    const previousData = queryClient.getQueryData<ShoppingList>([
      "shoppingLists",
      listId,
    ]);

    queryClient.setQueryData<ShoppingList | undefined>(
      ["shoppingLists", listId],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items?.map((i) =>
            i.id === itemId ? { ...i, chainCode: chainCode } : i
          ),
        };
      }
    );

    // Update the item
    updateItemMutation.mutate(
      {
        listId,
        itemId,
        data: {
          ...item,
          chainCode: chainCode,
        },
      },
      {
        onError: (error: Error) => {
          // Rollback on error
          if (previousData) {
            queryClient.setQueryData(["shoppingLists", listId], previousData);
          }
          toast.error(
            error.message || "Greška pri ažuriranju stavke. Pokušajte ponovno."
          );
        },
        onSettled: () => {
          queryClient.invalidateQueries({
            queryKey: ["shoppingLists", listId],
          });
          queryClient.invalidateQueries({ queryKey: ["shoppingLists", "me"] });
        },
      }
    );
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeletingItemId(itemId);
    // Optimistic update
    await queryClient.cancelQueries({ queryKey: ["shoppingLists", listId] });
    const previousData = queryClient.getQueryData<ShoppingList>([
      "shoppingLists",
      listId,
    ]);

    queryClient.setQueryData<ShoppingList | undefined>(
      ["shoppingLists", listId],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items?.filter((i) => i.id !== itemId),
        };
      }
    );

    // Delete the item
    deleteItemMutation.mutate(
      { listId, itemId },
      {
        onError: (error: Error) => {
          // Rollback on error
          if (previousData) {
            queryClient.setQueryData(["shoppingLists", listId], previousData);
          }
          toast.error(
            error.message || "Greška pri brisanju stavke. Pokušajte ponovno."
          );
        },
        onSuccess: () => {
          toast.success("Stavka je uspješno obrisana!");
        },
        onSettled: () => {
          setDeletingItemId(null);
          queryClient.invalidateQueries({
            queryKey: ["shoppingLists", listId],
          });
          queryClient.invalidateQueries({ queryKey: ["shoppingLists", "me"] });
        },
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
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
              onClick={handleEdit}
              title="Uredi popis"
            >
              <LucideClipboardEdit className="size-6" />
            </Button>

            <Button
              size="icon"
              variant="default"
              className="p-2 size-12 shrink-0 bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              title="Obriši popis"
              disabled={deleteShoppingListMutation.isPending}
            >
              {deleteShoppingListMutation.isPending ? (
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
        <h2 className="text-lg font-semibold">Proizvodi ({itemCount})</h2>

        {itemCount === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">Ovaj popis još nema stavki.</p>
          </Card>
        ) : (
          <Card className="p-4">
            <div className="space-y-1">
              {[...shoppingList.items]
                .sort((a, b) =>
                  a.name.localeCompare(b.name, "hr", { sensitivity: "base" })
                )
                .map((item, index, sortedItems) => {
                  // Map backend enum (e.g. "PLODINE" or "TRGOVINA_KRK") to our storeNamesMap key
                  const chainKey = item.chainCode
                    ? item.chainCode.toLowerCase().replace(/_/g, "-")
                    : null;
                  const storeName = chainKey
                    ? (storeNamesMap[chainKey] ?? chainKey)
                    : null;

                  return (
                    <div key={item.id}>
                      <div className="flex items-center justify-between py-1 flex-wrap sm:flex-nowrap gap-6">
                        {/* Left side: Checkbox, item name, and delete button (mobile) */}
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <Checkbox
                            checked={item.isChecked}
                            onCheckedChange={(checked) =>
                              handleItemCheckedChange(
                                item.id,
                                checked as boolean
                              )
                            }
                          />
                          <div className="flex-1">
                            <p
                              className={`text-sm sm:text-md ${
                                item.isChecked
                                  ? "line-through text-gray-500"
                                  : ""
                              }`}
                            >
                              {item.name}
                            </p>
                            {item.brand && (
                              <p className="text-xs sm:text-sm text-gray-600 text-wrap">
                                {item.brand}
                              </p>
                            )}
                          </div>

                          {/* Delete button - shown on mobile in same row as item name */}
                          <Button
                            size="icon"
                            variant="default"
                            className="size-7 sm:hidden p-2 bg-red-600 hover:bg-red-700"
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={deletingItemId === item.id}
                          >
                            {deletingItemId === item.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <X className="size-4" />
                            )}
                          </Button>
                        </div>

                        {/* Right side: Amount controls, price, and remove button */}
                        <div className="flex items-center justify-between gap-8 w-full sm:w-auto">
                          <div className="flex items-center justify-between gap-4 w-full">
                            {/* Amount controls */}
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="default"
                                className="size-7 sm:size-10"
                                onClick={() =>
                                  handleItemAmountChange(
                                    item.id,
                                    (item.amount || 1) - 1
                                  )
                                }
                                disabled={
                                  (item.amount || 1) <= 1 || item.isChecked
                                }
                              >
                                <Minus className="size-4 sm:size-5" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {item.amount || 1}
                              </span>
                              <Button
                                size="icon"
                                variant="default"
                                className="size-7 sm:size-10"
                                onClick={() =>
                                  handleItemAmountChange(
                                    item.id,
                                    (item.amount || 1) + 1
                                  )
                                }
                                disabled={item.isChecked}
                              >
                                <Plus className="size-4 sm:size-5" />
                              </Button>
                            </div>

                            <div className="hidden sm:block flex-shrink-0">
                              {/* Average price - from DB for checked items, from API for unchecked items */}
                              {(() => {
                                const price = item.isChecked
                                  ? item.avgPrice
                                  : averagePrices[item.id];
                                return price != null ? (
                                  <div className="text-sm font-medium text-gray-700 w-20 text-right">
                                    ~{price.toFixed(2)}€
                                  </div>
                                ) : null;
                              })()}
                            </div>

                            {/* Store Chain Select */}
                            <StoreChainSelect
                              value={item.chainCode}
                              onChange={(chainCode: string) =>
                                handleStoreChainChange(item.id, chainCode)
                              }
                              disabled={item.isChecked}
                              defaultValue={cheapestStores[item.id]}
                              storePrices={storePrices[item.id] || {}}
                              averagePrice={
                                item.isChecked
                                  ? item.avgPrice || undefined
                                  : averagePrices[item.id]
                              }
                              isChecked={item.isChecked}
                              storePriceFromDb={item.storePrice || undefined}
                              classname="sm:w-72 sm:flex-none"
                            />
                          </div>

                          {/* Remove button - hidden on mobile, shown on larger screens */}
                          <Button
                            size="icon"
                            variant="default"
                            className="hidden sm:flex size-7 sm:size-10 p-2 bg-red-600 hover:bg-red-700"
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={deletingItemId === item.id}
                          >
                            {deletingItemId === item.id ? (
                              <Loader2 className="size-4 sm:size-5 animate-spin" />
                            ) : (
                              <X className="size-4 sm:size-5" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Separator (except for last item) */}
                      {index < sortedItems.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  );
                })}
            </div>
          </Card>
        )}
      </div>

      {/* Store Summary */}
      <ShoppingListStoreSummary shoppingList={shoppingList} />

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
