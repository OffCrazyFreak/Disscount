"use client";

import { useEffect, useState } from "react";

import { useElementSize } from "@/app/[locale]/map/hooks/use-element-size";
import { IMapCover } from "@/app/[locale]/map/utils/view-area";

interface IUseMapCoverOptions {
  isMobile: boolean;
  isSearchOpen: boolean;
  onCoverChange: (cover: IMapCover) => void;
}

/** Reports what hides the map: the sheet and nav at the bottom on phones, the search panel at the right on desktop. */
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

  useEffect(() => {
    const isPanelCovering = !isMobile && isSearchOpen && panel?.offsetParent;

    onCoverChange({
      bottom: isMobile ? Math.max(sheetHeight, navHeight) : 0,
      // The panel's width plus its margin, so a store just beside it counts as hidden too.
      right: isPanelCovering
        ? panel.offsetParent.clientWidth - panel.offsetLeft
        : 0,
    });
  }, [
    isMobile,
    isSearchOpen,
    panel,
    panelWidth,
    sheetHeight,
    navHeight,
    onCoverChange,
  ]);

  return { setNavProbe, setPanel, setSheetHeight };
}
