"use client";

import { useId } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import StoreDetails from "@/app/[locale]/map/components/store/store-details";
import StoreSummary from "@/app/[locale]/map/components/store/store-summary";
import { IListedStore } from "@/app/[locale]/map/hooks/state/use-visible-stores";

interface IMapStoreCardProps {
  row: IListedStore;
  onClose: () => void;
}

/** The selected store's details, the same in the phone sheet and the desktop popover. */
export default function MapStoreCard({ row, onClose }: IMapStoreCardProps) {
  const t = useTranslations("shell");
  const id = useId();

  return (
    <>
      <div className="flex items-center gap-3 px-3 py-1">
        <StoreSummary row={row} isOpen id={id} />

        {/* In the store's row rather than a header band, which would spend a whole row on it. */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("modal.close")}
          onClick={onClose}
          className="shrink-0 text-muted-foreground"
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <StoreDetails row={row} />
    </>
  );
}
