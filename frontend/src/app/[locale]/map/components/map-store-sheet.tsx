"use client";

import { RefObject, useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DrawerClose } from "@/components/ui/drawer";
import SheetShell from "@/components/custom/modal/sheet-shell";
import StoreDetails from "@/app/[locale]/map/components/store-details";
import StoreSummary from "@/app/[locale]/map/components/store-summary";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";

interface IMapStoreSheetProps {
  row: IListedStore | null;
  onClose: () => void;
  /** The sheet's height in pixels, 0 once it closes. */
  onHeightChange: (height: number) => void;
  /**
   * Takes focus when the sheet closes. A map control, not the search field,
   * whose focus would raise the phone keyboard after an X tap.
   */
  returnFocusRef: RefObject<HTMLElement | null>;
}

/** The phone's selected store: swiping it away or the X deselects it. */
export default function MapStoreSheet({
  row,
  onClose,
  onHeightChange,
  returnFocusRef,
}: IMapStoreSheetProps) {
  const id = useId();
  // State, not a ref: the drawer's portal mounts a render after the sheet
  // opens, and the measuring has to start once the body actually exists.
  const [body, setBody] = useState<HTMLDivElement | null>(null);

  // The drawer itself is out of reach inside SheetShell, so it is found from
  // the body, which it wraps edge to edge.
  useEffect(() => {
    const drawer = body?.closest<HTMLElement>("[data-vaul-drawer]");
    if (!drawer) {
      onHeightChange(0);
      return;
    }

    const observer = new ResizeObserver(() =>
      onHeightChange(drawer.offsetHeight),
    );
    observer.observe(drawer);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body]);
  const t = useTranslations("shell");

  return (
    <SheetShell
      open={row != null}
      onOpenChange={(open) => !open && onClose()}
      title={row?.chainLabel ?? ""}
      srOnlyTitle
      // The map stays in use behind it: panning or tapping another store must
      // neither be blocked nor close the sheet.
      modal={false}
      returnFocusRef={returnFocusRef}
      bodyClassName="gap-0 px-1"
      className="md:hidden"
    >
      {row && (
        <>
          <div ref={setBody} className="flex items-center gap-3 px-3 py-1">
            <StoreSummary row={row} isOpen id={id} />

            {/* In the store's row rather than the sheet's header band, which
                would spend a whole row on it. */}
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("modal.close")}
                className="shrink-0 text-muted-foreground"
              >
                <X aria-hidden="true" />
              </Button>
            </DrawerClose>
          </div>

          <StoreDetails row={row} />
        </>
      )}
    </SheetShell>
  );
}
