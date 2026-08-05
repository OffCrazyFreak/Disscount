"use client";

import dynamic from "next/dynamic";

import useLingeringTarget from "@/components/custom/modal-router/use-lingering-target";
import type { ModalTarget } from "@/lib/modal/modal-registry";

const ShoppingListModal = dynamic(
  () =>
    import("@/app/(user)/shopping-lists/components/forms/shopping-list-modal"),
  { ssr: false },
);
const DigitalCardModal = dynamic(
  () =>
    import("@/app/(user)/digital-cards/components/forms/digital-card-modal"),
  { ssr: false },
);
const DigitalCardViewModal = dynamic(
  () =>
    import("@/app/(user)/digital-cards/components/view/digital-card-view-modal"),
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
      return (
        <ShoppingListModal
          open={open}
          action={rendered.action}
          id={rendered.action === "edit" ? rendered.id : undefined}
        />
      );
    case "digital-card":
      // View is a separate modal rather than a mode of the form: it is a different job,
      // reached by a different action, and shares only the card it reads.
      //
      // Keyed per card for the same reason add-to-list is: the outlet stays mounted
      // between openings, and the form's draft merge bails out while it is dirty, so a
      // reused instance would show card A's edits under card B's title.
      return rendered.action === "view" ? (
        <DigitalCardViewModal key={rendered.id} open={open} id={rendered.id} />
      ) : (
        <DigitalCardModal
          key={rendered.action === "edit" ? rendered.id : "new"}
          open={open}
          action={rendered.action}
          id={rendered.action === "edit" ? rendered.id : undefined}
        />
      );
    case "add-to-list":
      // Keyed so a second product gets its own instance. The form restores its
      // saved draft once, at mount, and this outlet stays mounted between
      // openings, so a reused instance handed product B product A's draft.
      return (
        <AddToShoppingListModal
          key={rendered.ean}
          open={open}
          ean={rendered.ean}
        />
      );
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
