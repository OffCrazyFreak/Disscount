"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import type { ModalTarget } from "@/lib/modal/modal-registry";

const ShoppingListModal = dynamic(
  () =>
    import("@/app/(user)/shopping-lists/components/forms/shopping-list-modal"),
  { ssr: false }
);
const DigitalCardModal = dynamic(
  () => import("@/app/(user)/digital-cards/components/forms/digital-card-modal"),
  { ssr: false }
);
const AddToShoppingListModal = dynamic(
  () => import("@/app/products/components/forms/add-to-shopping-list-form"),
  { ssr: false }
);
const WatchlistItemModal = dynamic(
  () => import("@/app/products/components/forms/watchlist-item-modal"),
  { ssr: false }
);

const ENTITY_NAMES = [
  "shopping-list",
  "digital-card",
  "add-to-list",
  "watchlist",
] as const;

export type EntityTarget = Extract<
  ModalTarget,
  { name: (typeof ENTITY_NAMES)[number] }
>;

export function isEntityTarget(
  target: ModalTarget | null
): target is EntityTarget {
  return (
    !!target && (ENTITY_NAMES as readonly string[]).includes(target.name)
  );
}

// Keeps the last target mounted briefly after close so the dialog's exit
// animation can play before the component unmounts.
function useLingeringTarget(target: EntityTarget | null) {
  const [lingering, setLingering] = useState(target);

  // Adjust-during-render pattern: track the latest non-null target without an
  // effect, then clear it shortly after close so exit animations can play.
  if (target && target !== lingering) setLingering(target);

  useEffect(() => {
    if (target) return;
    const timer = setTimeout(() => setLingering(null), 200);
    return () => clearTimeout(timer);
  }, [target]);

  return target ?? lingering;
}

export default function EntityModalOutlet({
  target,
}: {
  target: EntityTarget | null;
}) {
  const rendered = useLingeringTarget(target);
  if (!rendered) return null;

  const open = !!target && target.name === rendered.name;

  switch (rendered.name) {
    case "shopping-list":
    case "digital-card": {
      const Modal =
        rendered.name === "shopping-list" ? ShoppingListModal : DigitalCardModal;
      return (
        <Modal
          open={open}
          action={rendered.action}
          id={rendered.action === "edit" ? rendered.id : undefined}
        />
      );
    }
    case "add-to-list":
      return <AddToShoppingListModal open={open} ean={rendered.ean} />;
    case "watchlist":
      return (
        <WatchlistItemModal
          open={open}
          ean={rendered.ean}
          watchType={rendered.watchType}
        />
      );
  }
}
