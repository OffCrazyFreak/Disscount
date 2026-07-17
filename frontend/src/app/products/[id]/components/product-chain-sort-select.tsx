"use client";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductChainSortMode } from "@/app/products/utils/product-chain-sort";

interface IProductChainSortSelectProps {
  value: ProductChainSortMode;
  onValueChange: (mode: ProductChainSortMode) => void;
}

/** Picks how the chains carrying one product are ordered. */
export default function ProductChainSortSelect({
  value,
  onValueChange,
}: IProductChainSortSelectProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="text-sm text-muted-foreground">Sortiraj po</span>

      <Select
        value={value}
        onValueChange={(mode) => onValueChange(mode as ProductChainSortMode)}
      >
        <SelectTrigger className="w-full sm:w-60 bg-white" size="sm">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="stores">Trgovinama</SelectItem>
          <SelectItem value="price">Cijeni</SelectItem>
          <SelectItem value="distance" disabled>
            <span className="flex items-center gap-2">
              Udaljenosti
              <Badge className="text-[10px]">USKORO</Badge>
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
