"use client";

import { CreditCard } from "lucide-react";

import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import { useCardPhoto } from "@/app/(user)/digital-cards/hooks/use-card-photo";
import type { DigitalCardDto } from "@/lib/api/types";

interface ICardIconProps {
  card: DigitalCardDto;
}

function initialsOf(storeName: string): string {
  return storeName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

// Always a white disc with dark ink, so the icon reads on every palette colour.
export default function CardIcon({ card }: ICardIconProps) {
  const iconPhoto = card.photos.find((photo) => photo.slot === "icon");
  const photoUrl = useCardPhoto(card.id, iconPhoto, "full");
  const initials = initialsOf(card.storeName);

  return (
    <span
      aria-hidden="true"
      className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white text-xs font-bold text-gray-900 shadow-sm sm:size-10"
    >
      {photoUrl ? (
        <img src={photoUrl} alt="" className="size-full object-cover" />
      ) : card.chainCode ? (
        <StoreChainLogo chain={card.chainCode} className="object-contain p-1" />
      ) : initials ? (
        initials
      ) : (
        <CreditCard className="size-5" />
      )}
    </span>
  );
}
