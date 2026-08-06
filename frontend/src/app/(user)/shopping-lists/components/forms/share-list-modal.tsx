"use client";

import { useState } from "react";
import { Share2, Unlink } from "lucide-react";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { ConfirmDialog } from "@/components/custom/modal/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import SettingRow from "@/components/custom/settings/ui/setting-row";
import { LINK_ACCESS_HINTS } from "@/lib/api/schemas/shopping-list";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useShareListModal } from "@/app/(user)/shopping-lists/hooks/use-share-list-modal";
import ShareLinkRow from "@/app/(user)/shopping-lists/components/forms/share-link-row";

interface IShareListModalProps {
  open: boolean;
  id: string;
}

export default function ShareListModal({ open, id }: IShareListModalProps) {
  const {
    shoppingList,
    isLoading,
    isError,
    linkAccess,
    setLinkAccess,
    isSaving,
    isOffline,
    savedMessage,
    shareUrl,
    handleTextShare,
  } = useShareListModal(id);

  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const isShared = linkAccess !== "NONE";

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title="Podijeli popis"
      description="Svatko s poveznicom može otvoriti popis. Poveznicu možeš ukinuti u bilo kojem trenutku."
      cancelLabel="Zatvori"
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !shoppingList ? (
        <p className="text-sm text-muted-foreground">
          Popis nije pronađen. Možda je obrisan ili nemaš pristup.
        </p>
      ) : (
        <div className="space-y-6" aria-busy={isSaving}>
          {/* Nothing here navigates, and the switch has no submit button, so the save
              result would otherwise be silent for a screen reader. */}
          <p role="status" className="sr-only">
            {isSaving ? "Spremanje postavki dijeljenja..." : savedMessage}
          </p>

          <SettingRow
            label="Svatko s poveznicom"
            description={
              isShared
                ? "Popis je dostupan svakome tko ima poveznicu."
                : LINK_ACCESS_HINTS.NONE
            }
            control={
              <Switch
                aria-label="Svatko s poveznicom"
                checked={isShared}
                disabled={isSaving}
                onCheckedChange={(next) =>
                  next ? setLinkAccess("VIEW") : setIsRevokeOpen(true)
                }
              />
            }
          />

          {isShared && (
            <ShareLinkRow
              linkAccess={linkAccess}
              onLevelChange={setLinkAccess}
              shareUrl={shareUrl}
              isSaving={isSaving}
            />
          )}

          {/* Outside the isShared branch on purpose: it used to unmount at the exact
              moment it became true, so nothing ever told the owner the link had died. */}
          <p className="text-xs text-muted-foreground">
            Isključivanjem dijeljenja poveznica prestaje vrijediti. Ako ponovno
            uključiš dijeljenje, dobit ćeš novu poveznicu.
          </p>

          {isOffline && (
            <p className="text-xs text-muted-foreground">
              Nisi na mreži. Promjena će se spremiti kad se veza vrati.
            </p>
          )}

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleTextShare}
          >
            <Share2 aria-hidden="true" />
            Podijeli kao tekst
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={isRevokeOpen}
        onOpenChange={setIsRevokeOpen}
        title="Prestani dijeliti popis"
        description="Postojeća poveznica prestat će vrijediti i nitko je više neće moći otvoriti. Ako kasnije ponovno uključiš dijeljenje, dobit ćeš novu poveznicu."
        confirmLabel="Prestani dijeliti"
        variant="destructive"
        icon={Unlink}
        onConfirm={() => {
          setIsRevokeOpen(false);
          setLinkAccess("NONE");
        }}
      />
    </ModalShell>
  );
}
