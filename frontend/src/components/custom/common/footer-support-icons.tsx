import Link from "next/link";

import { supportNavItems } from "@/constants/navigation";

const LIVE_CLASS =
  "text-muted-foreground hover:text-primary block transition-all hover:scale-110";
const DISABLED_CLASS = "text-muted-foreground/50 block cursor-not-allowed";

/** Feedback entry icons, sharing supportNavItems with the sidebar group. */
export default function FooterSupportIcons() {
  return (
    <div className="flex items-center gap-4">
      {supportNavItems.map((item) => {
        const Icon = item.icon;
        const isLive = !item.comingSoon && item.href !== "#";

        return isLive ? (
          <Link
            key={item.id}
            href={item.href}
            aria-label={item.label}
            className={LIVE_CLASS}
          >
            <Icon size={16} />
          </Link>
        ) : (
          <button
            key={item.id}
            type="button"
            disabled
            aria-label={`${item.label} (uskoro)`}
            title="Uskoro"
            className={DISABLED_CLASS}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}
