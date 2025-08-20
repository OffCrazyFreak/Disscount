"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { userPreferencesSchema, UserPreferencesForm } from "@/lib/user-schemas";
import { mockStores, mockLocations } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { preferencesApi } from "@/lib/api-client";

interface UserPreferencesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserPreferencesModal({
  isOpen,
  onOpenChange,
}: UserPreferencesModalProps) {
  const form = useForm<UserPreferencesForm>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      pinnedStores: [],
      pinnedLocations: [],
    },
  });

  // Fetch current preferences when modal is open
  const {
    data: currentStores,
    isLoading: isStoresLoading,
    isError: isStoresError,
  } = useQuery({
    queryKey: ["preferences", "pinnedStores"],
    queryFn: preferencesApi.getCurrentUserPinnedStores,
    enabled: isOpen,
  });

  const {
    data: currentPlaces,
    isLoading: isPlacesLoading,
    isError: isPlacesError,
  } = useQuery({
    queryKey: ["preferences", "pinnedPlaces"],
    queryFn: preferencesApi.getCurrentUserPinnedPlaces,
    enabled: isOpen,
  });

  // When data arrives, reset the form with existing preferences
  useEffect(() => {
    if (!isOpen) return;
    if (currentStores || currentPlaces) {
      const storeIds = (currentStores || []).map((s) => s.storeApiId || s.id);
      const placeIds = (currentPlaces || []).map((p) => p.placeApiId || p.id);
      // reset form values with fetched IDs
      form.reset({ pinnedStores: storeIds, pinnedLocations: placeIds });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentStores, currentPlaces]);

  const preferencesMutation = useMutation({
    mutationFn: async (data: UserPreferencesForm) => {
      // Make both API calls in parallel
      const [storesResult, placesResult] = await Promise.all([
        preferencesApi.updatePinnedStores(data.pinnedStores),
        preferencesApi.updatePinnedPlaces(data.pinnedLocations),
      ]);
      return { stores: storesResult, places: placesResult };
    },
    onSuccess: () => {
      toast.success("Preference uspješno spremljene!");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Greška pri spremanju preferencija");
    },
  });

  const onSubmit = (data: UserPreferencesForm) => {
    preferencesMutation.mutate(data);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const toggleStore = (storeId: string) => {
    const current = form.getValues("pinnedStores");
    const updated = current.includes(storeId)
      ? current.filter((id) => id !== storeId)
      : [...current, storeId];
    form.setValue("pinnedStores", updated);
  };

  const isLoading = preferencesMutation.isPending;
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
                    const isSelected = form
                      .watch("pinnedStores")
                      .includes(store.id);
                    return (
                      <div
                        key={store.id}
                        className={cn(
                          "relative shadow-sm outline-2 rounded-lg cursor-pointer transition-all overflow-hidden",
                          isSelected
                            ? "outline-primary bg-green-100"
                            : "outline-gray-200 hover:outline-gray-400"
                        )}
                        onClick={() => toggleStore(store.id)}
                      >
                        <div className="size-24 sm:size-28 grid place-items-center relative transition-all">
                          {store.image && (
                            <Image
                              src={store.image}
                              alt={store.name}
                              fill
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
                name="pinnedLocations"
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
                              value={location.id}
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
                type="button"
                size={"lg"}
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Odustani
              </Button>

              <Button type="submit" size={"lg"} disabled={isLoading}>
                {preferencesMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Spremi preference"
                )}
              </Button>
            </div>
          </form>
        </Form>

        <DialogFooter className="text-xs text-gray-500 text-center my-2">
          Ove preference možeš kasnije izmijeniti u postavkama računa.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
