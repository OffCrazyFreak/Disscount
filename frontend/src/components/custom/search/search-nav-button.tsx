import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import { cn } from "@/lib/utils";
import type { INavigationItem } from "@/constants/navigation";

/** Pinned over because a disabled button would fade the badge; pointer-events-none keeps link clicks. */
const BADGE_CLASS =
  "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2";

interface ISearchNavButtonProps {
  item: INavigationItem;
  /** A coming-soon item nobody but an admin may open */
  isLocked?: boolean;
  /** Lets the sheet close itself, since a query-string change never will */
  onNavigate?: () => void;
}

/** A focusable aria-disabled link, because a disabled control hides why from keyboard users. */
export default function SearchNavButton({
  item,
  isLocked = false,
  onNavigate,
}: ISearchNavButtonProps) {
  const t = useTranslations("shell");
  const Icon = item.icon;
  const badgeId = `${item.id}-coming-soon`;

  return (
    <div className="relative">
      <Button asChild variant="outline" className="w-full">
        <Link
          href={item.href}
          aria-disabled={isLocked || undefined}
          aria-describedby={item.comingSoon ? badgeId : undefined}
          onClick={(event) => {
            if (isLocked) {
              event.preventDefault();
              return;
            }

            onNavigate?.();
          }}
          className={cn(isLocked && "cursor-not-allowed opacity-50")}
        >
          <Icon className="size-5" />

          {t(item.labelKey)}
        </Link>
      </Button>

      {item.comingSoon && (
        <ComingSoonBadge id={badgeId} className={BADGE_CLASS} />
      )}
    </div>
  );
}
