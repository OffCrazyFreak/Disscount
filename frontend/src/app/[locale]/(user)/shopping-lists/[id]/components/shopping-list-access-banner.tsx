"use client";

import { useTranslations } from "next-intl";
import { Banner } from "@/components/custom/common/banner";
import type { LinkAccess, ListAccess } from "@/lib/api/schemas/shopping-list";
import { LINK_ACCESS_ICONS } from "@/app/[locale]/(user)/shopping-lists/utils/link-access-icons";
import { SHARED_ACCESS_BANNER_ID } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-access";

interface IShoppingListAccessBannerProps {
  myAccess: ListAccess | undefined;
  isSignedIn: boolean;
}

/** What this visitor may do, in the same terms the owner picked in the share modal. */
const ACCESS_TEXT_KEYS = {
  VIEW: "access.view",
  SHOP: "access.shop",
  EDIT: "access.edit",
} as const satisfies Partial<Record<ListAccess, string>>;

/** Always renders, because disabled controls point at its id with aria-describedby and a cached DTO with no myAccess would leave that dangling. */
export default function ShoppingListAccessBanner({
  myAccess,
  isSignedIn,
}: IShoppingListAccessBannerProps) {
  const t = useTranslations("shoppingListDetail");

  const textKey =
    myAccess && myAccess in ACCESS_TEXT_KEYS
      ? ACCESS_TEXT_KEYS[myAccess as keyof typeof ACCESS_TEXT_KEYS]
      : undefined;
  if (!textKey) {
    return (
      <span id={SHARED_ACCESS_BANNER_ID} className="sr-only">
        {myAccess ? "" : t("access.checking")}
      </span>
    );
  }

  // An owner never reaches the branch above, so the remaining levels all exist in the map.
  const Icon = LINK_ACCESS_ICONS[myAccess as LinkAccess];

  // EDIT is the most a link can give, so there is nothing left to ask for.
  const text = t(textKey);
  const nextStep = !isSignedIn
    ? t("access.signIn")
    : myAccess === "EDIT"
      ? null
      : t("access.askOwner");

  return (
    <Banner
      variant="primarySoft"
      size="md"
      icon={Icon}
      text={nextStep ? t("access.withNextStep", { text, nextStep }) : text}
      id={SHARED_ACCESS_BANNER_ID}
    />
  );
}
