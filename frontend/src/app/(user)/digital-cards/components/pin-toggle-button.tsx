"use client";

import { Pin, PinOff } from "lucide-react";
import { toast } from "sonner";

import { digitalCardService } from "@/lib/api";
import { cn } from "@/lib/utils";
import { problemMessage } from "@/lib/api/problem-details";
import type { DigitalCardDto } from "@/lib/api/types";

interface IPinToggleButtonProps {
  card: DigitalCardDto;
  /** On a tile the control hides until hover; in the modal it is always a visible action. */
  revealOnHover?: boolean;
  className?: string;
}

export default function PinToggleButton({
  card,
  revealOnHover = false,
  className,
}: IPinToggleButtonProps) {
  const setPinned = digitalCardService.useSetDigitalCardPinned();
  const isPinned = !!card.pinnedAt;

  async function handleClick() {
    try {
      await setPinned.mutateAsync({ id: card.id, pinned: !isPinned });
    } catch (error) {
      toast.error(
        problemMessage(
          error,
          isPinned
            ? "Greška pri otkvačivanju kartice."
            : "Greška pri prikvačivanju kartice.",
        ),
      );
    }
  }

  const Icon = isPinned ? Pin : PinOff;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={setPinned.isPending}
      aria-pressed={isPinned}
      aria-label={isPinned ? "Otkvači karticu" : "Prikvači karticu"}
      className={cn(
        "grid size-7 cursor-pointer place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm transition",
        "hover:bg-black/45 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-60",
        // Pinned state is permanent information; unpinned is an affordance, so it only
        // appears on hover or once focused, and stays visible on touch where hover cannot.
        revealOnHover &&
          !isPinned &&
          "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
    </button>
  );
}
