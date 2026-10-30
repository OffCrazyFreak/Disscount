"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import { CELL_LABEL_CLASS } from "@/components/custom/bottom-nav/bottom-nav-classes";
import type { INavigationItem } from "@/constants/navigation";

interface IBottomNavItemLabelProps {
  item: INavigationItem;
  isBold: boolean;
}

export default function BottomNavItemLabel({
  item,
  isBold,
}: IBottomNavItemLabelProps) {
  const t = useTranslations("shell");

  return (
    <>
      <span className={cn(CELL_LABEL_CLASS, isBold && "font-bold")}>
        {t(item.shortLabelKey ?? item.labelKey)}
      </span>

      {item.comingSoon && (
        // Rotated off the right edge, the convention the header nav and the
        // landing page already use.
        <ComingSoonBadge className="pointer-events-none absolute top-[0.1rem] right-0 rotate-6 px-1 py-0 text-[0.5rem] shadow-none" />
      )}
    </>
  );
}
