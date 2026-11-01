"use client";

import { useTranslations } from "next-intl";
import type { DistanceSortState } from "@/app/[locale]/products/hooks/use-distance-sort";

interface IDistanceSortNoteProps {
  id: string;
  state: DistanceSortState;
}

/**
 * Why a "distance" sort is pending, done or abandoned. The live region stays
 * mounted, so a screen reader hears each change of state.
 */
export default function DistanceSortNote({
  id,
  state,
}: IDistanceSortNoteProps) {
  const t = useTranslations("common.distanceSort");

  return (
    <p
      id={id}
      role="status"
      // sr-only rather than hidden: a region that leaves the accessibility
      // tree is often not announced when it comes back.
      className={
        state === "idle"
          ? "sr-only"
          : "text-sm text-muted-foreground text-pretty"
      }
    >
      {state === "idle" ? null : t(state)}
    </p>
  );
}
