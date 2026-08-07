"use client";

import { Banner } from "@/components/custom/common/banner";
import type { LinkAccess, ListAccess } from "@/lib/api/schemas/shopping-list";
import { LINK_ACCESS_ICONS } from "@/app/(user)/shopping-lists/utils/link-access-icons";
import { SHARED_ACCESS_BANNER_ID } from "@/app/(user)/shopping-lists/utils/shopping-list-access";

interface IShoppingListAccessBannerProps {
  myAccess: ListAccess | undefined;
  isSignedIn: boolean;
}

/** What this visitor may do, in the same terms the owner picked in the share modal. */
const ACCESS_TEXT: Partial<Record<ListAccess, string>> = {
  VIEW: "Ovaj popis možeš samo pregledavati.",
  SHOP: "Možeš označiti što je kupljeno i birati trgovinu, ali ne možeš mijenjati popis.",
  EDIT: "Možeš mijenjati količine i brisati proizvode, ali ne možeš dodavati nove.",
};

/**
 * What the visitor can actually do here. Without it the page is a set of greyed-out
 * controls with no stated reason, which a screen reader renders as "dimmed" and nothing
 * else. The level is only knowable from myAccess, since linkAccess is nulled for anyone
 * who is not the owner.
 *
 * <p>Always renders the element, even when silent: disabled item controls point at its id
 * with aria-describedby, and a cached DTO with no myAccess would leave that dangling.
 */
export default function ShoppingListAccessBanner({
  myAccess,
  isSignedIn,
}: IShoppingListAccessBannerProps) {
  const text = myAccess ? ACCESS_TEXT[myAccess] : undefined;
  if (!text) {
    return (
      <span id={SHARED_ACCESS_BANNER_ID} className="sr-only">
        {myAccess ? "" : "Ovlasti za ovaj popis još se provjeravaju."}
      </span>
    );
  }

  // An owner never reaches the branch above, so the remaining levels all exist in the map.
  const Icon = LINK_ACCESS_ICONS[myAccess as LinkAccess];

  // EDIT is the most a link can give, so there is nothing left to ask for.
  const nextStep = !isSignedIn
    ? "Prijavi se za uređivanje."
    : myAccess === "EDIT"
      ? null
      : "Za više ovlasti obrati se vlasniku popisa.";

  return (
    <Banner
      variant="primarySoft"
      size="md"
      icon={Icon}
      text={nextStep ? `${text} ${nextStep}` : text}
      id={SHARED_ACCESS_BANNER_ID}
    />
  );
}
