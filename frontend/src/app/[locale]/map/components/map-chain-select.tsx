"use client";

import { useTranslations } from "next-intl";

import StoreChainMultiSelect from "@/components/custom/store-chain/store-chain-multi-select";
import { ALL_CHAINS } from "@/app/[locale]/map/hooks/use-map-url-state";

interface IMapChainSelectProps {
  chains: string[];
  selected: string[] | typeof ALL_CHAINS;
  onChange: (chains: string[] | typeof ALL_CHAINS) => void;
}

/**
 * The map's chain filter. Nothing picked means every chain, as in the product
 * filters, so the field starts empty instead of holding a badge per chain.
 * Ticking every chain stays a list, so "select all" leaves them all ticked.
 */
export default function MapChainSelect({
  chains,
  selected,
  onChange,
}: IMapChainSelectProps) {
  const t = useTranslations("map.chains");

  return (
    <StoreChainMultiSelect
      chains={chains}
      selectedChains={selected === ALL_CHAINS ? [] : selected}
      onChainsChange={(next) => onChange(next.length ? next : ALL_CHAINS)}
      placeholder={t("all")}
      className="w-full"
    />
  );
}
