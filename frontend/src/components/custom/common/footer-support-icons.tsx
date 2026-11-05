import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { supportNavItems } from "@/constants/navigation";

const LIVE_CLASS =
  "text-muted-foreground hover:text-primary transition-all hover:scale-110";
const DISABLED_CLASS = "text-muted-foreground/50";

/** Support entry icons, sharing supportNavItems with the sidebar group. */
export default function FooterSupportIcons() {
  const t = useTranslations("common");
  const tShell = useTranslations("shell");

  return (
    <div className="flex items-center gap-4">
      {supportNavItems.map((item) => {
        const Icon = item.icon;
        const isLive = !item.comingSoon && item.href !== "#";

        return isLive ? (
          <Button
            key={item.id}
            asChild
            variant="ghost"
            size="icon"
            aria-label={tShell(item.labelKey)}
            className={LIVE_CLASS}
          >
            <Link href={item.href}>
              <Icon aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            size="icon"
            disabled
            aria-label={t("footer.comingSoonLabel", {
              label: tShell(item.labelKey),
            })}
            title={t("footer.comingSoonTitle")}
            className={DISABLED_CLASS}
          >
            <Icon aria-hidden="true" />
          </Button>
        );
      })}
    </div>
  );
}
