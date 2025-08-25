"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import Image from "next/image";
import {
  userPreferencesSchema,
  UserPreferencesFormType,
} from "@/lib/schemas/user-schemas";
import { mockStores, mockLocations } from "@/lib/mock/mock-preferences";
import { cn } from "@/lib/utils";
import { preferencesService } from "@/lib/api";
import { useUser } from "@/lib/user-context";

interface UserPreferencesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserPreferencesModal({
  isOpen,
  onOpenChange,
}: UserPreferencesModalProps) {
  const form = useForm<UserPreferencesFormType>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      pinnedStores: [],
      pinnedPlaces: [],
    },
  });

  const { user, updatePinnedStores, updatePinnedPlaces } = useUser();

  // Fetch current preferences when modal is open
  const {
    data: currentStores,
    isLoading: isStoresLoading,
    isError: isStoresError,
  } = preferencesService.useGetPinnedStores();

  const {
    data: currentPlaces,
    isLoading: isPlacesLoading,
    isError: isPlacesError,
  } = preferencesService.useGetPinnedPlaces();

  // Update mutations
  const updateStoresMutation = preferencesService.useUpdatePinnedStores();
  const updatePlacesMutation = preferencesService.useUpdatePinnedPlaces();

  // When data arrives, reset the form with existing preferences (use store NAMES)
  useEffect(() => {
    if (!isOpen) return;

    // First try to use preferences from user context if available
    if (user?.pinnedStores || user?.pinnedPlaces) {
      const storeNames = (user.pinnedStores || []).map(
        (s) => s.storeName || s.storeApiId || s.id
      );
      const placeNames = (user.pinnedPlaces || []).map(
        (p) => p.placeName || p.placeApiId
      );

      form.reset({
        pinnedStores: storeNames,
        pinnedPlaces: placeNames,
      });
      return;
    }

    // Fall back to fetched data if context doesn't have the preferences
    if (currentStores || currentPlaces) {
      // Prefer the friendly store name when available, fall back to API id
      const storeNames = (currentStores || []).map(
        (s) => s.storeName || s.storeApiId || s.id
      );
      // use place names for UI selection
      const placeNames = (currentPlaces || []).map(
        (p) => p.placeName || p.placeApiId
      );

      // reset form values with fetched store NAMES and place NAMES
      form.reset({ pinnedStores: storeNames, pinnedPlaces: placeNames });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentStores, currentPlaces, user]);

  const onSubmit = async (data: UserPreferencesFormType) => {
    try {
      // Make both API calls in parallel
      const [storesResponse, placesResponse] = await Promise.all([
        updateStoresMutation.mutateAsync(
          {
            // data.pinnedStores now contains store NAMES; map them to API shape
            stores: data.pinnedStores.map((storeName) => ({
              storeApiId:
                mockStores.find((s) => s.name === storeName)?.id || storeName,
              storeName,
            })),
          },
          {
            onSuccess: () => {
              // Success handled after both calls complete
            },
            onError: (error) => {
              toast.error(
                error.message || "Greška pri spremanju preferenca trgovina"
              );
            },
          }
        ),
        updatePlacesMutation.mutateAsync(
          {
            // data.pinnedLocations now contains place NAMES; map them to API shape
            places: data.pinnedPlaces.map((placeName) => ({
              placeApiId:
                mockLocations.find((l) => l.name === placeName)?.id ||
                placeName,
              placeName,
            })),
          },
          {
            onSuccess: () => {
              // Success handled after both calls complete
            },
            onError: (error) => {
              toast.error(
                error.message || "Greška pri spremanju preferenca lokacija"
              );
            },
          }
        ),
      ]);

      // Update the user context with the responses
      updatePinnedStores(storesResponse);
      updatePinnedPlaces(placesResponse);

      toast.success("Preference uspješno spremljene!");
    } catch (error) {
      toast.error("Greška pri spremanju preferenca");
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const toggleStore = (storeName: string) => {
    const current = form.getValues("pinnedStores");
    const updated = current.includes(storeName)
      ? current.filter((name) => name !== storeName)
      : [...current, storeName];
    form.setValue("pinnedStores", updated);
  };

  const isLoading =
    updateStoresMutation.isPending || updatePlacesMutation.isPending;
  const isPrefLoading = isStoresLoading || isPlacesLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background sm:max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Preference</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {isPrefLoading && (
              <div className="p-6 flex items-center justify-center">
                <Loader2 className="animate-spin" />
              </div>
            )}
            <div className="space-y-8">
              <FormItem className="gap-0">
                <FormLabel className="text-md">Trgovine</FormLabel>
                <p className="text-sm text-gray-500 mb-4">
                  Odaberi trgovine u tvojoj blizini.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  {mockStores.map((store) => {
                    // Use store.name as the form value
                    const isSelected = form
                      .watch("pinnedStores")
                      .includes(store.name);
                    return (
                      <div
                        key={store.id}
                        className={cn(
                          "relative shadow-sm border-2 rounded-lg cursor-pointer transition-all overflow-hidden",
                          isSelected
                            ? "border-primary bg-green-100"
                            : "border-gray-200 hover:border-gray-400"
                        )}
                        onClick={() => toggleStore(store.name)}
                      >
                        <div className="size-20 sm:size-26 grid place-items-center relative transition-all">
                          {store.image && (
                            <Image
                              src={store.image}
                              alt={store.name}
                              fill
                              sizes="6rem"
                              className={cn(
                                "absolute inset-0 opacity-40",
                                isSelected && "opacity-100"
                              )}
                            />
                          )}
                          {(!isSelected || !store.image) && (
                            <span className="text-md font-bold text-center z-10">
                              {store.name}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-secondary rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </FormItem>

              <FormField
                control={form.control}
                name="pinnedPlaces"
                render={({ field }) => (
                  <FormItem className="gap-0">
                    <FormLabel
                      className="text-md w-max"
                      onClick={(ev: React.MouseEvent) => {
                        ev.stopPropagation();
                      }}
                    >
                      Naselja
                    </FormLabel>
                    <p className="text-sm text-gray-500 mb-2">
                      Odaberi naselja u tvojoj blizini.
                    </p>

                    <MultiSelect
                      onValuesChange={field.onChange}
                      values={field.value}
                    >
                      <FormControl>
                        <MultiSelectTrigger className="w-full">
                          <MultiSelectValue placeholder="Odaberi naselja..." />
                        </MultiSelectTrigger>
                      </FormControl>
                      <MultiSelectContent className=" bg-white">
                        <MultiSelectGroup>
                          {mockLocations.map((location) => (
                            <MultiSelectItem
                              key={location.id}
                              value={location.name}
                            >
                              {location.name}
                            </MultiSelectItem>
                          ))}
                        </MultiSelectGroup>
                      </MultiSelectContent>
                    </MultiSelect>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                size="lg"
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Odustani
              </Button>
              <Button
                size="lg"
                type="submit"
                disabled={isLoading || isPrefLoading}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Spremi"
                )}
              </Button>
            </div>
          </form>
        </Form>

        <DialogFooter className="text-xs text-gray-500 text-center my-2 block">
          Ove preference možeš uvijek izmijeniti u postavkama računa.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
