"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

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
import StoreChainLogo from "@/components/custom/store-chain-logo";
import {
  userPreferencesSchema,
  UserPreferencesFormType,
} from "@/lib/api/schemas/preferences";
import { PinnedStoreDto, PinnedPlaceDto } from "@/lib/api/schemas/preferences";
import { cn } from "@/lib/utils";
import { preferencesService } from "@/lib/api";
import { useUser } from "@/context/user-context";
import { useAllLocations } from "@/lib/cijene-api/hooks";
import cijeneService from "@/lib/cijene-api";
import { ChainStats } from "@/lib/cijene-api/schemas";
import { storeNamesMap } from "@/constants/name-mappings";

interface IUserPreferencesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserPreferencesModal({
  isOpen,
  onOpenChange,
}: IUserPreferencesModalProps) {
  const { user, updatePinnedStores, updatePinnedPlaces } = useUser();
  const t = useTranslations("settings.preferences");
  const tCommon = useTranslations("common");

  const form = useForm<UserPreferencesFormType>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      pinnedStores: [],
      pinnedPlaces: [],
    },
  });

  const { data: chainStats, isLoading: chainStatsLoading } =
    cijeneService.useGetChainStats();

  const { data: locations, isLoading: locationsLoading } = useAllLocations();

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
    const userPrefs = user as {
      pinnedStores?: PinnedStoreDto[];
      pinnedPlaces?: PinnedPlaceDto[];
    };

    if (userPrefs?.pinnedStores || userPrefs?.pinnedPlaces) {
      const storeNames = (
        (userPrefs.pinnedStores as PinnedStoreDto[]) || []
      ).map((s) => s.storeName || s.storeApiId || s.id);
      const placeNames = (
        (userPrefs.pinnedPlaces as PinnedPlaceDto[]) || []
      ).map((p) => p.placeName || p.placeApiId);

      form.reset({
        pinnedStores: storeNames,
        pinnedPlaces: placeNames,
      });
      return;
    }

    // Fall back to fetched data if context doesn't have the preferences
    if (currentStores || currentPlaces) {
      // Prefer the friendly store name when available, fall back to API id
      const storeNames = ((currentStores as PinnedStoreDto[]) || []).map(
        (s) => s.storeName || s.storeApiId || s.id,
      );
      // use place names for UI selection
      const placeNames = ((currentPlaces as PinnedPlaceDto[]) || []).map(
        (p) => p.placeName || p.placeApiId,
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
            // data.pinnedStores now contains chain_codes; map them to API shape
            stores: data.pinnedStores.map((storeCode) => ({
              storeApiId: storeCode,
              storeName: storeCode,
            })),
          },
          {
            onSuccess: () => {
              // Success handled after both calls complete
            },
            onError: (error) => {
              toast.error(error.message || t("saveStoresError"));
            },
          },
        ),

        updatePlacesMutation.mutateAsync(
          {
            // data.pinnedLocations now contains place NAMES; map them to API shape
            places: data.pinnedPlaces.map((placeName) => ({
              placeApiId: placeName,
              placeName,
            })),
          },
          {
            onSuccess: () => {
              // Success handled after both calls complete
            },
            onError: (error) => {
              toast.error(error.message || t("saveLocationsError"));
            },
          },
        ),
      ]);

      // Update the user context with the responses
      updatePinnedStores(storesResponse);
      updatePinnedPlaces(placesResponse);

      toast.success(t("saveSuccess"));
    } catch {
      toast.error(t("saveError"));
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
      <DialogContent aria-describedby="user-preferences-modal">
        <DialogHeader>
          <DialogTitle className="text-xl">{t("title")}</DialogTitle>
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
                <FormLabel className="text-md">{t("storesLabel")}</FormLabel>
                <p className="text-sm text-gray-500 mb-4">{t("storesHint")}</p>

                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                  {chainStats?.chain_stats
                    .sort((a, b) =>
                      a.chain_code.localeCompare(b.chain_code, "hr", {
                        sensitivity: "base",
                      }),
                    )
                    .map((chain: ChainStats) => {
                      const pinnedStores = form.watch("pinnedStores");
                      const isSelected = pinnedStores.includes(
                        chain.chain_code,
                      );
                      return (
                        <div
                          key={chain.chain_code}
                          className={cn(
                            "relative shadow-sm border-2 rounded-lg cursor-pointer transition-all overflow-hidden",
                            isSelected
                              ? "border-primary bg-green-100"
                              : "border-gray-200 hover:border-gray-400",
                          )}
                          onClick={() => toggleStore(chain.chain_code)}
                        >
                          <div className="size-16 sm:size-20 grid place-items-center relative transition-all">
                            <StoreChainLogo
                              chain={chain.chain_code}
                              fill
                              sizes="128px"
                              className={cn(
                                "opacity-40 object-contain",
                                isSelected && "opacity-100",
                              )}
                            />

                            {/* {!isSelected && (
                              <span className="hidden sm:text-xs font-bold text-center z-10 p-1 break-all">
                                {storeNamesMap[chain.chain_code] || chain.chain_code}
                              </span>
                            )} */}
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
                      {t("locationsLabel")}
                    </FormLabel>
                    <p className="text-sm text-gray-500 mb-2">
                      {t("locationsHint")}
                    </p>

                    <MultiSelect
                      onValuesChange={field.onChange}
                      values={field.value}
                    >
                      <FormControl>
                        <MultiSelectTrigger className="w-full">
                          <MultiSelectValue
                            placeholder={t("locationsPlaceholder")}
                          />
                        </MultiSelectTrigger>
                      </FormControl>
                      <MultiSelectContent className=" bg-white">
                        <MultiSelectGroup>
                          {locations
                            .sort((a, b) =>
                              a.name.localeCompare(b.name, "hr", {
                                sensitivity: "base",
                              }),
                            )
                            .map((location) => (
                              <MultiSelectItem
                                key={location.name}
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
                {tCommon("cancel")}
              </Button>
              <Button
                size="lg"
                type="submit"
                disabled={isLoading || isPrefLoading}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  tCommon("save")
                )}
              </Button>
            </div>
          </form>
        </Form>

        <DialogFooter className="text-xs text-gray-500 text-center my-2 block">
          {t("footer")}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
