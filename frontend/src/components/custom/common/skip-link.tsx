import { useTranslations } from "next-intl";
import SkipLinkAnchor from "@/components/custom/common/skip-link-anchor";

export const MAIN_CONTENT_ID = "main-content";

// WCAG 2.4.1 Bypass Blocks: it must stay the first focusable element in <body>, before the providers.
export default function SkipLink() {
  const t = useTranslations("shell.skipLink");

  return <SkipLinkAnchor targetId={MAIN_CONTENT_ID} label={t("label")} />;
}
