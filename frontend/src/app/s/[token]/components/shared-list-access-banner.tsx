"use client";

import { Eye, LogIn, Pencil, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Banner } from "@/components/custom/common/banner";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import type { ListAccess } from "@/lib/api/schemas/shopping-list";
import { SHARED_ACCESS_BANNER_ID } from "@/app/(user)/shopping-lists/utils/shopping-list-access";

const ACCESS_TEXT: Record<string, { icon: typeof Eye; text: string }> = {
  VIEW: { icon: Eye, text: "Ovaj popis samo pregledavaš." },
  SHOP: { icon: ShoppingCart, text: "Možeš označavati stavke kao kupljene." },
  EDIT: { icon: Pencil, text: "Možeš mijenjati stavke na ovom popisu." },
};

interface ISharedListAccessBannerProps {
  myAccess: ListAccess;
  isSignedIn: boolean;
}

/**
 * What the visitor can actually do here. Without it the page is a set of greyed-out
 * controls with no stated reason, which a screen reader renders as "dimmed" and nothing
 * else. The level is only knowable from myAccess, since linkAccess is nulled for anyone
 * who is not the owner.
 */
export default function SharedListAccessBanner({
  myAccess,
  isSignedIn,
}: ISharedListAccessBannerProps) {
  const access = ACCESS_TEXT[myAccess];
  if (!access) return null;

  // Anonymous callers are capped at VIEW whatever the link grants, so signing in may or
  // may not gain them anything. The client cannot tell which, so the copy does not promise.
  if (!isSignedIn) {
    return (
      <Banner
        variant="primarySoft"
        size="md"
        icon={LogIn}
        id={SHARED_ACCESS_BANNER_ID}
      >
        <p className="text-xs text-primary/90">
          Bez prijave možeš samo pregledati popis. Prijavi se ako ti je vlasnik
          dopustio izmjene.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 h-7 px-2"
          onClick={() => openModalUrl({ name: "login" })}
        >
          Prijava
        </Button>
      </Banner>
    );
  }

  return (
    <Banner
      variant="infoSoft"
      size="sm"
      icon={access.icon}
      text={access.text}
      id={SHARED_ACCESS_BANNER_ID}
    />
  );
}
