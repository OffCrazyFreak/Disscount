"use client";

import { ReactNode, Ref, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

import MapSearchField from "@/app/[locale]/map/components/search/map-search-field";
import MapSearchSurface from "@/app/[locale]/map/components/search/map-search-surface";
import { useElementSize } from "@/app/[locale]/map/hooks/layout/use-element-size";
import { useHeaderSlot } from "@/app/[locale]/map/hooks/layout/use-header-slot";
import { useMorphTransition } from "@/app/[locale]/map/hooks/layout/use-morph-transition";
import { useSearchOpener } from "@/app/[locale]/map/hooks/layout/use-search-opener";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInstallBannerHold } from "@/components/custom/pwa/install-banner-hold";

const PLACEMENT = {
  // Fixed, so the open list escapes the layout's clip and runs under the bottom nav.
  phone: {
    root: "fixed inset-0",
    panel: "absolute inset-x-0 bottom-0",
    surface: undefined,
    shadowBleed: 0,
  },
  // Hidden on phones until hydration (the server renders it); ends above the map controls unless the window is short.
  desktop: {
    root: "absolute top-[calc(var(--header-bottom)+--spacing(3))] right-3 bottom-[9rem] [@media(height<40rem)]:bottom-3 flex w-[min(24rem,calc(100%-1.5rem))] flex-col max-md:hidden",
    panel: "relative min-h-0 flex-1",
    surface: "rounded-2xl border shadow-lg",
    // Room for the open panel's shadow, which the clip would otherwise cut.
    shadowBleed: 24,
  },
};

interface IMapSearchBarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** The filters and the list, shown once the bar has opened. */
  children: ReactNode;
  /** The desktop panel's box, which covers the map's right side while open. */
  panelRef?: Ref<HTMLDivElement>;
}

/** Phones grow the header's search into the whole screen; desktop grows a field at the map's top right into a panel. */
export default function MapSearchBar({
  isOpen,
  onOpenChange,
  children,
  panelRef,
}: IMapSearchBarProps) {
  const isMobile = useIsMobile();
  const placement = isMobile ? PLACEMENT.phone : PLACEMENT.desktop;

  // The open phone search fills the screen, so the banner would only cover the list.
  useInstallBannerHold("map-search", isMobile && isOpen);
  const opener = useSearchOpener({ isOpen, onOpenChange });
  const transition = useMorphTransition(isOpen);
  const header = useHeaderSlot();
  const [row, setRow] = useState<HTMLDivElement | null>(null);
  const rowHeight = useElementSize(row).height;

  // On desktop the closed surface hugs the field's row, the box the open panel grows from.
  const frame = isMobile
    ? header.frame
    : { top: 0, left: 0, right: 0, bottom: rowHeight };

  const field = (
    <MapSearchField
      isOpen={isOpen}
      isInHeader={isMobile}
      opener={opener}
      transition={transition}
    />
  );

  return (
    <div
      ref={panelRef}
      className={`pointer-events-none z-[3] ${placement.root}`}
      onKeyDown={opener.handleKeyDown}
    >
      <MapSearchSurface
        isOpen={isOpen}
        frame={frame}
        transition={transition}
        className={placement.surface}
        bleed={placement.shadowBleed}
      />

      {/* On phones the field replaces the page header's content; events from the portal still bubble here. */}
      {isMobile ? (
        header.slot && createPortal(field, header.slot)
      ) : (
        <div
          ref={setRow}
          className="pointer-events-auto relative flex px-3 pt-3"
        >
          {field}
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            data-map-search-panel
            className={`pointer-events-auto flex flex-col ${placement.panel}`}
            style={{ top: isMobile ? frame?.bottom : undefined }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ ...transition, delay: transition.duration && 0.15 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
