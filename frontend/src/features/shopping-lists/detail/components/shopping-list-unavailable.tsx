"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Lock, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import NoResults from "@/components/custom/common/no-results";
import { isDeadListLink } from "@/lib/api/shopping-lists/is-dead-list-link";

interface IShoppingListUnavailableProps {
  error: Error | null;
  onRetry: () => void;
  isSignedIn: boolean;
}

/** Only a 404 means a dead link; a retry elsewhere stops a shopper on flaky data asking for a new link. */
export default function ShoppingListUnavailable({
  error,
  onRetry,
  isSignedIn,
}: IShoppingListUnavailableProps) {
  const t = useTranslations("shoppingListDetail");
  const isDeadLink = isDeadListLink(error);

  if (isDeadLink) {
    return (
      <div className="mx-auto">
        {/* Unshared and nonexistent lists read the same, so the wording cannot confirm an id is real. */}
        <NoResults
          icon={
            <Lock
              aria-hidden="true"
              className="mx-auto mb-4 size-12 text-muted-foreground"
            />
          }
          title={t("unavailable.deadLinkTitle")}
          description={t("unavailable.deadLinkDescription")}
        />

        <div className="text-center">
          <Button asChild variant="ghost">
            <Link href={isSignedIn ? "/shopping-lists" : "/products"}>
              <ArrowLeft aria-hidden="true" />
              {isSignedIn ? t("backToLists") : t("unavailable.exploreProducts")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <NoResults
        icon={
          <WifiOff
            aria-hidden="true"
            className="mx-auto mb-4 size-12 text-muted-foreground"
          />
        }
        title={t("unavailable.loadFailedTitle")}
        description={t("unavailable.loadFailedDescription")}
      />

      <div className="text-center">
        <Button variant="primary" onClick={onRetry}>
          {t("unavailable.retry")}
        </Button>
      </div>
    </div>
  );
}
