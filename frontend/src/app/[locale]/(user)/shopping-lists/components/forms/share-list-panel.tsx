import { useId } from "react";
import { useTranslations } from "next-intl";

import type { LinkAccess } from "@/lib/api/types";
import ShareAccessRow from "@/app/[locale]/(user)/shopping-lists/components/forms/share-access-row";
import ShareListButtons from "@/app/[locale]/(user)/shopping-lists/components/forms/share-list-buttons";

interface IShareListPanelProps {
  linkAccess: LinkAccess;
  onLevelChange: (level: LinkAccess) => void;
  isSaving: boolean;
  isOffline: boolean;
  isLevelShareable: boolean;
  onLinkShare: () => void;
  onTextShare: () => void;
}

export default function ShareListPanel({
  linkAccess,
  onLevelChange,
  isSaving,
  isOffline,
  isLevelShareable,
  onLinkShare,
  onTextShare,
}: IShareListPanelProps) {
  const t = useTranslations("shoppingLists");
  const hintId = useId();

  // Gated on the save too: the level updates optimistically, so between picking a level
  // and the server granting it the button would hand out a link that does not open yet.
  const canShareLink = isLevelShareable && !isSaving;

  return (
    <div className="space-y-6" aria-busy={isSaving}>
      {/* Announces the in-flight state only. Success is the toast, which carries its
          own live region, so saying it here too would announce it twice. */}
      <p role="status" className="sr-only">
        {isSaving ? t("shareModal.saving") : ""}
      </p>

      <ShareAccessRow
        linkAccess={linkAccess}
        onLevelChange={onLevelChange}
        isSaving={isSaving}
        hintId={hintId}
      />

      {isOffline && (
        <p className="text-xs text-muted-foreground">
          {t("shareModal.offline")}
        </p>
      )}

      <ShareListButtons
        canShareLink={canShareLink}
        hintId={hintId}
        onLinkShare={onLinkShare}
        onTextShare={onTextShare}
      />
    </div>
  );
}
