"use client";

import { CreditCard } from "lucide-react";

import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import { cn } from "@/lib/utils";
import { getStoreInitials } from "@/app/(user)/digital-cards/utils/card-labels";

interface ICardIconProps {
  iconImage: string | null;
  chainCode: string | null;
  storeName: string;
  className?: string;
}

/**
 * The icon is resolved at render time rather than copied into the card on save: an official
 * chain's logo stays current when the asset changes, and costs nothing in the payload.
 */
export default function CardIcon({
  iconImage,
  chainCode,
  storeName,
  className,
}: ICardIconProps) {
  const shell = cn(
    "relative grid size-full place-items-center overflow-hidden rounded-full bg-white",
    className,
  );

  if (iconImage) {
    return (
      <div className={shell}>
        {/* A data URI, so next/image would only add a proxy hop. */}
        <img src={iconImage} alt="" className="size-full object-contain p-1" />
      </div>
    );
  }

  if (chainCode) {
    return (
      <div className={shell}>
        <StoreChainLogo chain={chainCode} fill sizes="96px" />
      </div>
    );
  }

  return (
    <div className={shell}>
      {storeName.trim() ? (
        <span
          aria-hidden="true"
          className="text-lg font-semibold text-slate-700"
        >
          {getStoreInitials(storeName)}
        </span>
      ) : (
        <CreditCard aria-hidden="true" className="size-1/2 text-slate-400" />
      )}
    </div>
  );
}
