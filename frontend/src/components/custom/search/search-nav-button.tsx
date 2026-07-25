import Link from "next/link";
import { Button } from "@/components/ui/button";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import type { INavigationItem } from "@/constants/navigation";

/**
 * Pinned over the button rather than inside it, as in the sidebar: a disabled
 * button is half-transparent, and a badge that faded with it stopped being
 * readable.
 */
const BADGE_CLASS = "absolute top-1/2 right-3 -translate-y-1/2";

interface ISearchNavButtonProps {
  item: INavigationItem;
  /** A coming-soon item nobody but an admin may open */
  isLocked?: boolean;
}

/**
 * A catalogue shortcut in the search sheet, outlined rather than filled so the
 * Pretraži button above it stays the one loud action.
 *
 * The sheet is the fourth nav surface after the sidebar, the header and the bar,
 * and it locks its coming-soon items exactly as those three do.
 */
export default function SearchNavButton({
  item,
  isLocked = false,
}: ISearchNavButtonProps) {
  const Icon = item.icon;

  const label = (
    <>
      <Icon className="size-5" />

      {item.label}
    </>
  );

  return (
    <div className="relative">
      {isLocked ? (
        <Button type="button" variant="outline" disabled className="w-full">
          {label}
        </Button>
      ) : (
        <Button asChild variant="outline" className="w-full">
          <Link href={item.href}>{label}</Link>
        </Button>
      )}

      {item.comingSoon && <ComingSoonBadge className={BADGE_CLASS} />}
    </div>
  );
}
