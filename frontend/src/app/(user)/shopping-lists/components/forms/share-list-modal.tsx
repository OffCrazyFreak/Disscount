"use client";

import { Share2 } from "lucide-react";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import CopyButton from "@/components/custom/common/copy-button";
import LabeledSelect from "@/components/custom/common/labeled-select";
import SettingRow from "@/components/custom/settings/ui/setting-row";
import { LOADING_LABELS } from "@/constants/loading-labels";
import type { LinkAccess } from "@/lib/api/types";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useShareListModal } from "@/app/(user)/shopping-lists/hooks/use-share-list-modal";

interface IShareListModalProps {
  open: boolean;
  id: string;
}

const LEVEL_OPTIONS = [
  { value: "VIEW", label: "Samo pregled" },
  { value: "SHOP", label: "Kupovina" },
  { value: "EDIT", label: "Uređivanje" },
] as const satisfies readonly { value: LinkAccess; label: string }[];

const LEVEL_HINTS: Record<string, string> = {
  VIEW: "Mogu vidjeti popis i cijene, ali ništa mijenjati.",
  SHOP: "Mogu označavati stavke kao kupljene i birati trgovinu.",
  EDIT: "Mogu mijenjati količine, brisati stavke i promijeniti naziv popisa.",
};

export default function ShareListModal({ open, id }: IShareListModalProps) {
  const {
    shoppingList,
    isLoading,
    isError,
    linkAccess,
    setLinkAccess,
    isSaving,
    shareUrl,
    handleTextShare,
    isSharingText,
  } = useShareListModal(id);

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
        <div className="space-y-6">
          <SettingRow
            label="Svatko s poveznicom"
            description={
              isShared
                ? "Popis je dostupan svakome tko ima poveznicu."
                : "Popis je privatan i vidiš ga samo ti."
            }
            control={
              <Switch
                aria-label="Svatko s poveznicom"
                checked={isShared}
                disabled={isSaving}
                // Turning this back on mints a new token, so the previous link stays dead.
                onCheckedChange={(next) =>
                  setLinkAccess(next ? "VIEW" : "NONE")
                }
              />
            }
          />

          {isShared && (
            <div className="space-y-4">
              <div className="space-y-2">
                <LabeledSelect<LinkAccess>
                  label="Što mogu raditi"
                  value={linkAccess}
                  onValueChange={setLinkAccess}
                  options={LEVEL_OPTIONS}
                  className="justify-between"
                />
                <p className="text-xs text-muted-foreground">
                  {LEVEL_HINTS[linkAccess]}
                </p>
              </div>

              {shareUrl && (
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
                  <p className="min-w-0 flex-1 truncate font-mono text-xs">
                    {shareUrl}
                  </p>
                  <CopyButton
                    value={shareUrl}
                    label="Kopiraj poveznicu"
                    successMessage="Poveznica je kopirana"
                  />
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Isključivanjem dijeljenja poveznica prestaje vrijediti. Ako
                ponovno uključiš dijeljenje, dobit ćeš novu poveznicu.
              </p>
            </div>
          )}

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleTextShare}
            disabled={isSharingText}
          >
            {isSharingText ? (
              <BlockLoadingSpinner size={20} className="text-inherit" />
            ) : (
              <Share2 aria-hidden="true" />
            )}
            {isSharingText ? LOADING_LABELS.sharing : "Podijeli kao tekst"}
          </Button>
        </div>
      )}
    </ModalShell>
  );
}
