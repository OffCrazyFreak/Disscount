"use client";

import { Banner } from "@/components/custom/common/banner";
import type { LinkAccess, ListAccess } from "@/lib/api/schemas/shopping-list";
import { LINK_ACCESS_ICONS } from "@/app/(user)/shopping-lists/utils/link-access-icons";
import { SHARED_ACCESS_BANNER_ID } from "@/app/(user)/shopping-lists/utils/shopping-list-access";

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
 */
export default function SharedListAccessBanner({
  myAccess,
  isSignedIn,
}: {
  myAccess: ListAccess;
  isSignedIn: boolean;
}) {
  const text = ACCESS_TEXT[myAccess];
  if (!text) return null;

  // OWNER never reaches this page, so the remaining levels all exist in LINK_ACCESS_ICONS.
  const Icon = LINK_ACCESS_ICONS[myAccess as LinkAccess];

  // Where to go for more, rather than leaving a dead end. Anonymous callers are capped at
  // VIEW whatever the link grants, so the offer is to sign in; EDIT is the most a link can
  // give, so there is nothing left to ask for.
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
      // One sentence, so the next step reads as part of the same thought rather than a
      // second line the eye has to find.
      text={nextStep ? `${text} ${nextStep}` : text}
      id={SHARED_ACCESS_BANNER_ID}
    />
  );
}
