"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import type { IEditCardLoadState } from "@/app/[locale]/(user)/digital-cards/hooks/use-edit-card";
import { Skeleton } from "@/components/ui/skeleton";

interface ICardLoadGateProps {
  loadState: IEditCardLoadState;
  children: ReactNode;
}

/** Holds the form back until the card being edited has loaded. */
export default function CardLoadGate({
  loadState,
  children,
}: ICardLoadGateProps) {
  const t = useTranslations("digitalCards.form");

  if (loadState.loading) return <Skeleton className="h-64 w-full" />;

  if (loadState.loadError) {
    return (
      <p className="text-sm text-muted-foreground">
        {loadState.offlineWaiting ? t("loadErrorOffline") : t("loadError")}
      </p>
    );
  }

  if (loadState.notFound) {
    return <p className="text-sm text-muted-foreground">{t("notFound")}</p>;
  }

  return children;
}
