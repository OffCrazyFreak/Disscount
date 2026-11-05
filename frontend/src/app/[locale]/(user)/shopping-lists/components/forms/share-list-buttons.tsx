import { FileText, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IShareListButtonsProps {
  canShareLink: boolean;
  hintId: string;
  onLinkShare: () => void;
  onTextShare: () => void;
}

export default function ShareListButtons({
  canShareLink,
  hintId,
  onLinkShare,
  onTextShare,
}: IShareListButtonsProps) {
  const t = useTranslations("shoppingLists");

  return (
    // Reversed on desktop so the primary action sits on the right, while the column
    // keeps it on top. DOM order stays primary-first, so it is also the first of the
    // two a keyboard or screen reader reaches at either width.
    <div className="flex flex-col gap-2 sm:flex-row-reverse">
      <Button
        type="button"
        variant="primary"
        onClick={canShareLink ? onLinkShare : undefined}
        // aria-disabled, not disabled: a natively disabled button leaves the tab
        // order, so a keyboard user never lands on it and never hears the
        // description explaining why the action went away.
        aria-disabled={!canShareLink}
        className={cn("flex-1", !canShareLink && "opacity-50")}
        // Points at the access hint, so the reason it is unavailable is readable
        // rather than something the user has to infer from the select.
        aria-describedby={canShareLink ? undefined : hintId}
      >
        <Link2 aria-hidden="true" />
        {t("shareModal.shareLink")}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="flex-1"
        onClick={onTextShare}
      >
        <FileText aria-hidden="true" />
        {t("shareModal.shareText")}
      </Button>
    </div>
  );
}
