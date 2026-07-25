import Link from "next/link";
import { Button } from "@/components/ui/button";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import type { INavigationItem } from "@/constants/navigation";

/**
 * Pinned over the button rather than placed inside it, as in the sidebar: a
 * disabled button is half-transparent, and a badge fading with it stops reading.
 */
const BADGE_CLASS = "absolute top-1/2 right-3 -translate-y-1/2";

interface ISearchNavButtonProps {
  item: INavigationItem;
  /** A coming-soon destination nobody but an admin may open */
  isLocked: boolean;
}

/** The sheet's own nav surface, so a shortcut out of it looks like the sidebar's. */
export default function SearchNavButton({
  item,
  isLocked,
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
