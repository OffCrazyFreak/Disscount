"use client";

import { UseFormReturn } from "react-hook-form";

import StoreChainSelect from "@/components/custom/store-chain/store-chain-select";
import { AddToListFormData } from "@/app/products/typings/add-to-list";

interface IStoreChainFieldProps {
  formField: UseFormReturn<AddToListFormData>;
  cheapestStore: string | null;
  storePrices: Record<string, number>;
  averagePrice: number | null;
}

export default function StoreChainField({
  formField,
  cheapestStore,
  storePrices,
  averagePrice,
}: IStoreChainFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Trgovina</label>
      <StoreChainSelect
        value={formField.watch("chainCode") || ""}
        onChange={(value) => formField.setValue("chainCode", value)}
        defaultValue={cheapestStore}
        storePrices={storePrices}
        averagePrice={averagePrice || undefined}
        isChecked={false}
        classname="w-full"
      />
    </div>
  );
}
