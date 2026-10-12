"use client";

import { CreditCard } from "lucide-react";

import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import { useCardPhoto } from "@/app/(user)/digital-cards/hooks/use-card-photo";
import { initialsOf } from "@/app/(user)/digital-cards/utils/card-initials";
import type { DigitalCardDto } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface ICardIconProps {
  card: DigitalCardDto;
}

// Initials sit on an ink-coloured disc; artwork gets a light disc because logos are drawn for white.
export default function CardIcon({ card }: ICardIconProps) {
  const iconPhoto = card.photos.find((photo) => photo.slot === "icon");
  const photoUrl = useCardPhoto(card.id, iconPhoto, "full");
  const initials = initialsOf(card.storeName);
  const artwork = Boolean(photoUrl || card.chainCode);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid size-[32px] shrink-0 place-items-center overflow-hidden rounded-full text-xs font-bold",
        artwork
          ? "bg-[#fafafa] text-gray-900 shadow-[0_0_0_1px_var(--logo-ring),0_1px_1px_rgb(0_0_0/0.16)]"
          : "bg-[var(--ink)] text-[var(--opp)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--opp)_18%,transparent),0_1px_1px_rgb(0_0_0/0.16)]",
      )}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="" className="size-full object-cover" />
      ) : card.chainCode ? (
        <StoreChainLogo chain={card.chainCode} className="object-contain p-1" />
      ) : initials ? (
        initials
      ) : (
        <CreditCard className="size-4" />
      )}
    </span>
  );
}
