import Link from "next/link";
import { Button } from "@/components/ui/button";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import { cn } from "@/lib/utils";
import type { INavigationItem } from "@/constants/navigation";

/**
 * Pinned over the button rather than inside it, as in the sidebar: a disabled
 * button is half-transparent, and a badge that faded with it stopped being
 * readable. pointer-events-none so it never eats a click meant for the link.
 */
const BADGE_CLASS =
  "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2";

interface ISearchNavButtonProps {
  item: INavigationItem;
  /** A coming-soon item nobody but an admin may open */
  isLocked?: boolean;
  /** Lets the sheet close itself, since a query-string change never will */
  onNavigate?: () => void;
}

/**
 * A catalogue shortcut in the products sheet, outlined rather than filled so the
 * Pretraži button above it stays the one loud action.
 *
 * A locked item stays a focusable link marked aria-disabled, rather than becoming
 * a disabled button: a disabled control leaves the tab order entirely, so a
 * keyboard user never reached it and never heard why it was closed.
 */
export default function SearchNavButton({
  item,
  isLocked = false,
  onNavigate,
}: ISearchNavButtonProps) {
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

          {item.label}
        </Link>
      </Button>

      {item.comingSoon && (
        <ComingSoonBadge id={badgeId} className={BADGE_CLASS} />
      )}
    </div>
  );
}
