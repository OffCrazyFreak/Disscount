"use client";

import React, { memo } from "react";
import { ChevronDown, Loader2, MapPin, Tag } from "lucide-react";
import Image from "next/image";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { storeNamesMap } from "@/utils/mappings";
import { cn } from "@/lib/utils";
import cijeneService from "@/lib/cijene-api";

interface ChainItemProps {
  stat: any;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
  isLast: boolean;
}

// Memoized component for individual chain items to prevent unnecessary re-renders
export const ChainItem = memo(
  ({ stat, isExpanded, onToggle, index, isLast }: ChainItemProps) => {
    // Fetch stores for this specific chain when the item is rendered
    const { data: storesData, isLoading: storesLoading } =
      cijeneService.useListStoresByChain(stat.chain_code);

    return (
      <div>
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 size-12 sm:size-16 rounded-sm overflow-hidden shadow-sm">
                <Image
                  src={`/store-chains/${stat.chain_code}.png`}
                  alt={storeNamesMap[stat.chain_code]}
                  width="256"
                  height="256"
                  className=" object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {storeNamesMap[stat.chain_code]}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-2 sm:gap-4 flex-wrap my-2">
                      <span className="flex items-center gap-2">
                        <MapPin className="size-5 mb-1" />
                        {stat.store_count}{" "}
                        {parseInt(stat.store_count.toString().slice(-1)) > 1 &&
                        parseInt(stat.store_count.toString().slice(-1)) < 5 &&
                        stat.store_count > 21
                          ? "trgovine"
                          : "trgovina"}
                      </span>
                      <span className="hidden sm:inline">|</span>
                      <span className="flex items-center gap-2">
                        <Tag className="size-5 mb-1" />
                        {stat.price_count}{" "}
                        {parseInt(stat.price_count.toString().slice(-1)) > 1 &&
                        parseInt(stat.price_count.toString().slice(-1)) < 5 &&
                        stat.price_count > 21
                          ? "cijene"
                          : "cijena"}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      className={cn(
                        "size-8 text-gray-500 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="mt-4">
              {storesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin mr-2" />
                  Učitavanje trgovina...
                </div>
              ) : storesData?.stores && storesData.stores.length > 0 ? (
                <div className="max-h-128 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="">
                        <TableHead className="font-bold">Grad</TableHead>
                        <TableHead className="font-bold">Adresa</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {storesData.stores
                        .sort((a, b) =>
                          (a.city || "").localeCompare(b.city || "", "hr", {
                            sensitivity: "base",
                          })
                        )
                        .map((store) => (
                          <TableRow key={store.address}>
                            <TableCell className="text-gray-700">
                              {store.city || "Nepoznato"}
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {store.address || "Nepoznato"}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nema podataka o trgovinama
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {!isLast && <Separator className="my-4" />}
      </div>
    );
  }
);

ChainItem.displayName = "ChainItem";
