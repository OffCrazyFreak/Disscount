import { useTranslations } from "next-intl";

// Navigation items are data-driven (their `id` is a plain string), but next-intl
// types `t` to literal message keys. This hook centralizes the lookup and the one
// necessary cast so the header and sidebar can translate nav labels by id without
// repeating it. Keys live under the `navigation.<id>` namespace in the catalogs.
export function useNavTranslation() {
  const t = useTranslations("navigation");
  type NavKey = Parameters<typeof t>[0];

  return {
    label: (id: string) => t(`${id}.label` as NavKey),
    short: (id: string) => t(`${id}.short` as NavKey),
  };
}
