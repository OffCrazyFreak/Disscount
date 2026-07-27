import Link from "next/link";

import { supportNavItems } from "@/constants/navigation";

const LIVE_CLASS =
  "text-muted-foreground hover:text-primary inline-flex size-10 items-center justify-center rounded-md transition-all hover:scale-110";
const DISABLED_CLASS =
  "text-muted-foreground/50 inline-flex size-10 cursor-not-allowed items-center justify-center rounded-md";

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
            <Icon size={20} />
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
            <Icon size={20} />
          </button>
        );
      })}
    </div>
  );
}
