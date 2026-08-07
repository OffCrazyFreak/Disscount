"use client";

import { useId } from "react";
import { FileText, Link2 } from "lucide-react";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useShareListModal } from "@/app/(user)/shopping-lists/hooks/use-share-list-modal";
import ShareAccessRow from "@/app/(user)/shopping-lists/components/forms/share-access-row";
import { resolveShoppingListAccess } from "@/app/(user)/shopping-lists/utils/shopping-list-access";

interface IShareListModalProps {
  open: boolean;
  id: string;
}

/** No footer on purpose: every change saves itself, so there is nothing to confirm. */
export default function ShareListModal({ open, id }: IShareListModalProps) {
  const {
    shoppingList,
    isLoading,
    isError,
    linkAccess,
    setLinkAccess,
    isSaving,
    isOffline,
    shareUrl,
    handleLinkShare,
    handleTextShare,
  } = useShareListModal(id);

  const hintId = useId();

  // The list route serves link visitors as well as its owner, so a signed-in recipient can
  // reach this modal by URL. Only the owner may see or change who else has access.
  const canManageShare = resolveShoppingListAccess(
    shoppingList?.myAccess,
  ).canManageShare;

  // Gated on the save too: the level updates optimistically, so between picking a level
  // and the server granting it the button would hand out a link that does not open yet.
  const canShareLink = linkAccess !== "NONE" && !!shareUrl && !isSaving;

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title="Podijeli popis"
      description="Pošalji poveznicu i neka ti netko pomogne u kupnji."
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !shoppingList || !canManageShare ? (
        <p className="text-sm text-muted-foreground">
          Popis nije pronađen. Možda je obrisan ili nemaš pristup.
        </p>
      ) : (
        <div className="space-y-6" aria-busy={isSaving}>
          {/* Announces the in-flight state only. Success is the toast, which carries its
              own live region, so saying it here too would announce it twice. */}
          <p role="status" className="sr-only">
            {isSaving ? "Spremanje postavki dijeljenja..." : ""}
          </p>

          <ShareAccessRow
            linkAccess={linkAccess}
            onLevelChange={setLinkAccess}
            isSaving={isSaving}
            hintId={hintId}
          />

          {isOffline && (
            <p className="text-xs text-muted-foreground">
              Nisi na mreži. Promjena će se spremiti kad se veza vrati.
            </p>
          )}

          {/* Reversed on desktop so the primary action sits on the right, while the column
              keeps it on top. DOM order stays primary-first, so it is also the first of the
              two a keyboard or screen reader reaches at either width. */}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              onClick={handleLinkShare}
              disabled={!canShareLink}
              // Points at the access hint, so the reason it is unavailable is readable
              // rather than something the user has to infer from the select.
              aria-describedby={canShareLink ? undefined : hintId}
            >
              <Link2 aria-hidden="true" />
              Podijeli poveznicu
            </Button>

            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleTextShare}
            >
              <FileText aria-hidden="true" />
              Podijeli tekst
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
