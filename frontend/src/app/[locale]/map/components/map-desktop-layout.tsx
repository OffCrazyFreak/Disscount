"use client";

import { ReactNode, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import MapLocateButton from "@/app/[locale]/map/components/map-locate-button";
import MapPanel from "@/app/[locale]/map/components/map-panel";
import MapSearch from "@/app/[locale]/map/components/map-search";
import MapSearchSurface from "@/app/[locale]/map/components/map-search-surface";
import MapStorePopover from "@/app/[locale]/map/components/map-store-popover";
import { IMapViewModel } from "@/app/[locale]/map/hooks/use-map-view-model";
import { useOffsetHeight } from "@/app/[locale]/map/hooks/use-offset-height";
import { useMorphTransition } from "@/app/[locale]/map/hooks/use-morph-transition";
import { useSearchOpener } from "@/app/[locale]/map/hooks/use-search-opener";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { IViewArea } from "@/app/[locale]/map/utils/view-area";

interface IMapDesktopLayoutProps {
  model: IMapViewModel;
  viewArea: IViewArea | null;
  /** The map, with an overlay rendered inside it and its pin picks sent to onSelect. */
  renderMap: (overlay: ReactNode, onSelect: (key: string) => void) => ReactNode;
}

function hasPin(row: IListedStore | null) {
  return row != null && row.store.lat != null && row.store.lon != null;
}

export default function MapDesktopLayout({
  model,
  viewArea,
  renderMap,
}: IMapDesktopLayoutProps) {
  const t = useTranslations("map.layout");
  const locateRef = useRef<HTMLButtonElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  // The closed surface hugs the field's row, the box the open panel grows from.
  const rowHeight = useOffsetHeight(rowRef);
  const [isSearchOpen, setSearchOpen] = useState(false);

  // A store without a pin has nowhere to show but its open row, so it keeps the search open.
  const isUnplacedSelected = model.selected != null && !hasPin(model.selected);
  const isOpen = isSearchOpen || isUnplacedSelected;

  function changeOpen(open: boolean) {
    setSearchOpen(open);
    if (!open && isUnplacedSelected) model.selectStore(null);
  }

  // A store with a pin shows at the pin, so the search gives way to it.
  function selectStore(key: string | null) {
    model.selectStore(key);

    const row =
      model.listed.find((listed) => listed.key === key) ?? model.selected;
    if (key && hasPin(row)) setSearchOpen(false);
  }

  const opener = useSearchOpener({ isOpen, onOpenChange: changeOpen });
  const transition = useMorphTransition(isOpen);

  const popover = (
    <MapStorePopover
      row={isOpen ? null : model.selected}
      onClose={() => model.selectStore(null)}
      returnFocusRef={locateRef}
    />
  );

  return (
    // The server renders this on phones too, so until hydration it holds the phone's empty frame.
    <div
      data-page-width="full"
      className="fixed inset-0 z-[1] md:static md:min-h-0 md:w-full md:flex-1"
    >
      <div className="relative hidden h-full overflow-hidden rounded-xl border md:block">
        {/* First in the DOM for tab order; it ends above the map's controls so they stay usable. */}
        <div
          className="pointer-events-none absolute top-3 right-3 bottom-[9rem] z-[3] flex w-[min(24rem,calc(100%-1.5rem))] flex-col"
          onKeyDown={opener.handleKeyDown}
        >
          <MapSearchSurface
            isOpen={isOpen}
            frame={{ top: 0, left: 0, right: 0, bottom: rowHeight }}
            transition={transition}
            className="rounded-2xl border shadow-lg"
          />

          <div
            ref={rowRef}
            className="pointer-events-auto relative flex items-center gap-1 px-3 pt-3"
          >
            {isOpen && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("backToMap")}
                // A keyboard press reports no clicks in event.detail.
                onClick={(event) => opener.close(event.detail === 0)}
                className="shrink-0"
              >
                <ArrowLeft aria-hidden="true" />
              </Button>
            )}

            <div className="min-w-0 flex-1" {...opener.fieldProps}>
              <MapSearch inputRef={opener.inputRef} />
            </div>
          </div>

          {isOpen && (
            <motion.div
              className="pointer-events-auto relative flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition, delay: transition.duration && 0.15 }}
            >
              <MapPanel model={{ ...model, selectStore }} viewArea={viewArea} />
            </motion.div>
          )}
        </div>

        <div className="absolute inset-0">
          {renderMap(popover, selectStore)}

          <MapLocateButton
            ref={locateRef}
            status={model.geolocation.status}
            onLocate={model.geolocation.locate}
          />
        </div>
      </div>
    </div>
  );
}
