"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { useElementSize } from "@/app/[locale]/map/hooks/use-element-size";
import { HEADER_BOTTOM_CHANGE_EVENT } from "@/hooks/use-header-bottom-variable";
import { IMapCover } from "@/app/[locale]/map/utils/view-area";

interface IUseMapCoverOptions {
  isMobile: boolean;
  isSearchOpen: boolean;
  onCoverChange: (cover: IMapCover) => void;
}

function subscribeToHeader(onChange: () => void) {
  window.addEventListener(HEADER_BOTTOM_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(HEADER_BOTTOM_CHANGE_EVENT, onChange);
}

// The header publishes its bottom edge in pixels once measured; until then the map counts it as uncovered.
function readHeaderBottom() {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--header-bottom")
    .trim();
  return value.endsWith("px") ? Number.parseFloat(value) : 0;
}

/** What hides the map: the header on top, the phone sheet and nav at the bottom, the desktop panel at the right. */
export function useMapCover({
  isMobile,
  isSearchOpen,
  onCoverChange,
}: IUseMapCoverOptions) {
  const [navProbe, setNavProbe] = useState<HTMLDivElement | null>(null);
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const [sheetHeight, setSheetHeight] = useState(0);
  const navHeight = useElementSize(navProbe).height;
  const panelWidth = useElementSize(panel).width;
  // The header floats over the map at every width.
  const headerBottom = useSyncExternalStore(
    subscribeToHeader,
    readHeaderBottom,
    () => 0,
  );

  useEffect(() => {
    const isPanelCovering = !isMobile && isSearchOpen && panel?.offsetParent;

    onCoverChange({
      top: headerBottom,
      bottom: isMobile ? Math.max(sheetHeight, navHeight) : 0,
      // The panel's width plus its margin, so a store just beside it counts as hidden too.
      right: isPanelCovering
        ? panel.offsetParent.clientWidth - panel.offsetLeft
        : 0,
    });
  }, [
    isMobile,
    isSearchOpen,
    headerBottom,
    panel,
    panelWidth,
    sheetHeight,
    navHeight,
    onCoverChange,
  ]);

  return { setNavProbe, setPanel, setSheetHeight };
}
