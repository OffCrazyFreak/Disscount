"use client";

import dynamic from "next/dynamic";

import useLingeringTarget from "@/components/custom/modal-router/use-lingering-target";
import type { ModalTarget } from "@/lib/modal/modal-registry";

const ShoppingListModal = dynamic(
  () =>
    import("@/app/(user)/shopping-lists/components/forms/shopping-list-modal"),
  { ssr: false },
);
const ShareListModal = dynamic(
  () => import("@/app/(user)/shopping-lists/components/forms/share-list-modal"),
  { ssr: false },
);
const DigitalCardModal = dynamic(
  () =>
    import("@/app/(user)/digital-cards/components/forms/digital-card-modal"),
  { ssr: false },
);
const AddToShoppingListModal = dynamic(
  () => import("@/app/products/components/forms/add-to-shopping-list-form"),
  { ssr: false },
);
const WatchlistItemModal = dynamic(
  () => import("@/app/products/components/forms/watchlist-item-modal"),
  { ssr: false },
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
  target: ModalTarget | null,
): target is EntityTarget {
  return !!target && (ENTITY_NAMES as readonly string[]).includes(target.name);
}

interface IEntityModalOutletProps {
  target: EntityTarget | null;
}

export default function EntityModalOutlet({ target }: IEntityModalOutletProps) {
  const rendered = useLingeringTarget(target);
  if (!rendered) return null;

  const open = !!target && target.name === rendered.name;

  switch (rendered.name) {
    case "shopping-list":
      // Sharing is its own modal: it saves on change rather than behind a submit button,
      // because the server has to mint the token before there is a link to show.
      if (rendered.action === "share") {
        return <ShareListModal open={open} id={rendered.id} />;
      }
      return (
        <ShoppingListModal
          open={open}
          action={rendered.action}
          id={rendered.action === "edit" ? rendered.id : undefined}
        />
      );
    case "digital-card":
      return (
        <DigitalCardModal
          open={open}
          action={rendered.action}
          id={rendered.action === "edit" ? rendered.id : undefined}
        />
      );
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
