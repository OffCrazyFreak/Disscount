"use client";

import dynamic from "next/dynamic";

import useLingeringTarget from "@/app/[locale]/components/modal-router/use-lingering-target";
import type { ModalTarget } from "@/lib/modal/modal-registry";

const ShoppingListModal = dynamic(
  () =>
    import("@/app/[locale]/(user)/shopping-lists/components/forms/shopping-list-modal"),
  { ssr: false },
);
const ShareListModal = dynamic(
  () =>
    import("@/app/[locale]/(user)/shopping-lists/components/forms/share-list-modal"),
  { ssr: false },
);

const CopyListModal = dynamic(
  () =>
    import("@/app/[locale]/(user)/shopping-lists/components/forms/copy-list-modal"),
  { ssr: false },
);
const DigitalCardModal = dynamic(
  () =>
    import("@/app/[locale]/(user)/digital-cards/components/forms/digital-card-modal"),
  { ssr: false },
);
const DigitalCardViewModal = dynamic(
  () =>
    import("@/app/[locale]/(user)/digital-cards/components/view/digital-card-view-modal"),
  { ssr: false },
);
const AddToShoppingListModal = dynamic(
  () =>
    import("@/app/[locale]/products/components/forms/add-to-shopping-list-form"),
  { ssr: false },
);
const AddPlainItemModal = dynamic(
  () => import("@/app/[locale]/products/components/forms/add-plain-item-modal"),
  { ssr: false },
);
const WatchlistItemModal = dynamic(
  () => import("@/app/[locale]/products/components/forms/watchlist-item-modal"),
  { ssr: false },
);

const ENTITY_NAMES = [
  "shopping-list",
  "digital-card",
  "add-to-list",
  "add-plain-item",
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
      // Its own modal because it saves on change, with nothing to confirm once the URL is the list's own.
      if (rendered.action === "share") {
        return <ShareListModal open={open} id={rendered.id} />;
      }
      if (rendered.action === "copy") {
        // Keyed because this outlet lingers 200ms, and a reused instance would carry a typed name over.
        return <CopyListModal key={rendered.id} open={open} id={rendered.id} />;
      }
      return (
        <ShoppingListModal
          open={open}
          action={rendered.action}
          id={rendered.action === "edit" ? rendered.id : undefined}
        />
      );
    case "digital-card":
      if (rendered.action === "view") {
        // Keyed because the view holds a temporary code type and rotation that must not carry over to the next card.
        return (
          <DigitalCardViewModal
            key={rendered.id}
            open={open}
            id={rendered.id}
          />
        );
      }
      return (
        <DigitalCardModal
          open={open}
          action={rendered.action}
          id={rendered.action === "edit" ? rendered.id : undefined}
        />
      );
    case "add-to-list":
      // Keyed because the form restores its draft once at mount, or product B gets product A's draft.
      return (
        <AddToShoppingListModal
          key={`${rendered.ean}.${rendered.listId}`}
          open={open}
          ean={rendered.ean}
          listId={rendered.listId}
        />
      );
    case "add-plain-item":
      // Keyed on the name so a new empty search starts from its own query.
      return (
        <AddPlainItemModal
          key={rendered.itemName}
          open={open}
          itemName={rendered.itemName}
        />
      );
    case "watchlist":
      // Keyed on the ean, so a threshold never crosses products while switching mode keeps both numbers.
      return (
        <WatchlistItemModal
          key={rendered.ean}
          open={open}
          ean={rendered.ean}
          watchType={rendered.watchType}
        />
      );
  }
}
