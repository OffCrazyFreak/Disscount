"use client";

import { ChevronsUp } from "lucide-react";
import BackToTopButton from "@/components/custom/fab/back-to-top-button";
import FabMenu from "@/components/custom/fab/fab-menu";
import type { IFabAction } from "@/components/custom/fab/fab-action";
import { useScrolledPast } from "@/hooks/use-scrolled-past";
import { scrollToTop } from "@/utils/scroll";

interface IPageFabProps {
  /** Omit on a page with no primary action, leaving back-to-top alone */
  primary?: IFabAction;
  /** How far to scroll before back-to-top appears */
  threshold?: number;
}

/**
 * A page's floating actions: its primary action, plus back-to-top.
 *
 * The menu is mobile-only, mirroring the inline button each page already shows
 * from `sm` up. Back-to-top runs at every width, since a long page scrolls on a
 * desktop too, and stands alone wherever there is no primary action.
 */
export default function PageFab({ primary, threshold = 600 }: IPageFabProps) {
  const isScrolled = useScrolledPast(threshold);

  if (!primary) {
    return <BackToTopButton threshold={threshold} />;
  }

  // Back-to-top joins once scrolled, sitting furthest out so primary keeps the shorter reach.
  const actions: IFabAction[] = isScrolled
    ? [
        { icon: ChevronsUp, label: "Natrag na vrh", onClick: scrollToTop },
        primary,
      ]
    : [primary];

  // Both render only a fixed container, so a wrapper div would add an in-flow child.
  return (
    <>
      <FabMenu actions={actions} className="sm:hidden" />

      {/* The menu is gone from sm up, so back-to-top stands on its own */}
      <BackToTopButton
        threshold={threshold}
        containerClassName="hidden sm:block"
      />
    </>
  );
}
