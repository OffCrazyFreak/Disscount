"use client";

import { RefObject, useEffect, useEffectEvent, useState } from "react";

import SheetShell from "@/components/custom/modal/sheet-shell";
import MapStoreCard from "@/features/map/components/store/map-store-card";
import { IListedStore } from "@/features/map/hooks/use-visible-stores";

interface IMapStoreSheetProps {
  row: IListedStore | null;
  onClose: () => void;
  /** The sheet's height in pixels, 0 once it closes. */
  onHeightChange: (height: number) => void;
  /** A map control, not the search field, whose focus would raise the phone keyboard after an X tap. */
  returnFocusRef: RefObject<HTMLElement | null>;
}

/** The phone's selected store: swiping it away or the X deselects it. */
export default function MapStoreSheet({
  row,
  onClose,
  onHeightChange,
  returnFocusRef,
}: IMapStoreSheetProps) {
  // State, because the portal mounts a render later, and measuring must start once the body exists.
  const [body, setBody] = useState<HTMLDivElement | null>(null);

  const reportHeight = useEffectEvent(onHeightChange);

  // The drawer is out of reach inside SheetShell, so it is found from the body, which it wraps edge to edge.
  useEffect(() => {
    const drawer = body?.closest<HTMLElement>('[data-slot="drawer-popup"]');
    if (!drawer) {
      reportHeight(0);
      return;
    }

    const observer = new ResizeObserver(() =>
      reportHeight(drawer.offsetHeight),
    );
    observer.observe(drawer);

    return () => observer.disconnect();
  }, [body]);

  return (
    <SheetShell
      open={row != null}
      onOpenChange={(open) => !open && onClose()}
      title={row?.chainLabel ?? ""}
      srOnlyTitle
      // The map stays in use behind it: panning or tapping another store must neither be blocked nor close the sheet.
      modal={false}
      returnFocusRef={returnFocusRef}
      bodyClassName="gap-0 px-1"
      className="md:hidden"
    >
      {row && (
        <div ref={setBody}>
          <MapStoreCard row={row} onClose={onClose} />
        </div>
      )}
    </SheetShell>
  );
}
