"use client";

import { useFormContext } from "react-hook-form";

import { FormItem, FormLabel } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import StoreChainLogo from "@/components/custom/store-chain-logo";
import cijeneService from "@/lib/cijene-api";
import { cn } from "@/lib/utils";
import { SettingsFormValues } from "@/components/custom/settings/settings-schema";

export function PinnedStoresGrid() {
  const form = useFormContext<SettingsFormValues>();
  const { data: chainStats, isLoading } = cijeneService.useGetChainStats();

  const selected = form.watch("pinnedStores");

  function toggleStore(chainCode: string) {
    const updated = selected.includes(chainCode)
      ? selected.filter((code) => code !== chainCode)
      : [...selected, chainCode];
    form.setValue("pinnedStores", updated, { shouldDirty: true });
  }

  return (
    <FormItem className="gap-0">
      <FormLabel className="text-md">Trgovine</FormLabel>
      <p className="text-sm text-gray-500 mb-4">
        Odaberi trgovine u tvojoj blizini.
      </p>

      {isLoading ? (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="size-16 sm:size-20 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          {chainStats?.chain_stats
            .slice()
            .sort((a, b) =>
              a.chain_code.localeCompare(b.chain_code, "hr", {
                sensitivity: "base",
              })
            )
            .map((chain) => {
              const isSelected = selected.includes(chain.chain_code);
              return (
                <div
                  key={chain.chain_code}
                  className={cn(
                    "relative shadow-sm border-2 rounded-lg cursor-pointer transition-all overflow-hidden",
                    isSelected
                      ? "border-primary bg-green-100"
                      : "border-gray-200 hover:border-gray-400"
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
                        isSelected && "opacity-100"
                      )}
                    />
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
      )}
    </FormItem>
  );
}
