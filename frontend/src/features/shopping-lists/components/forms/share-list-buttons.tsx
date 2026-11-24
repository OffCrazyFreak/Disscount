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
    // Reversed on desktop so primary sits right; DOM order stays primary-first for keyboards.
    <div className="flex flex-col gap-2 sm:flex-row-reverse">
      <Button
        type="button"
        variant="primary"
        onClick={canShareLink ? onLinkShare : undefined}
        // aria-disabled, because a disabled button leaves the tab order and hides why the action went away.
        aria-disabled={!canShareLink}
        className={cn("flex-1", !canShareLink && "opacity-50")}
        // Points at the access hint, so the reason is readable rather than inferred from the select.
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
