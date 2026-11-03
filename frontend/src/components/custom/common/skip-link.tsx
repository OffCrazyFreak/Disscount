import { useTranslations } from "next-intl";

export const MAIN_CONTENT_ID = "main-content";

// WCAG 2.4.1 Bypass Blocks: it must stay the first focusable element in <body>.
export default function SkipLink() {
  const t = useTranslations("shell.skipLink");

  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[var(--z-skip-link)] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {t("label")}
    </a>
  );
}
