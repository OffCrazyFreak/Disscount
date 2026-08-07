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

const CopyListModal = dynamic(
  () => import("@/app/(user)/shopping-lists/components/forms/copy-list-modal"),
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
      // since there is nothing to confirm once the URL is the list's own.
      if (rendered.action === "share") {
        return <ShareListModal open={open} id={rendered.id} />;
      }
      if (rendered.action === "copy") {
        // Keyed like the modals below: this outlet lingers 200ms after close, and the
        // copy form now holds a typed name, which a reused instance would carry over to
        // the next list instead of re-seeding from it.
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
      return (
        <DigitalCardModal
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
      // Keyed for the same reason as add-to-list, and because its seeding keeps
      // dirty values so a refetch cannot overwrite a number mid-edit: a reused
      // instance would carry product A's edited threshold into product B. Keyed on
      // the ean only, so switching watch mode reuses the instance and keeps both
      // numbers, which is what the mode toggle does anyway.
      //
      // Reuse happens when the target swaps straight to another product, or on a
      // reopen inside useLingeringTarget's exit window. An ordinary close unmounts
      // the outlet, so this is not guarding every reopen.
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
