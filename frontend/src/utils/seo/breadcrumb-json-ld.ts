import { localizedUrl } from "@/i18n/alternates";
import type { AppLocale } from "@/i18n/locales";

interface IBreadcrumbJsonLdItem {
  name: string;
  url: string;
}

/** Google reads the trail from `position`, and the last item may name the page itself. */
export function breadcrumbListJsonLd(items: IBreadcrumbJsonLdItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface IBreadcrumbStep {
  label: string;
  /** Unlocalized app path; the last step's path is the page itself. */
  path: string;
}

/** The same steps the visible trail shows, as absolute URLs in the page's language. */
export function breadcrumbStepsJsonLd(
  steps: IBreadcrumbStep[],
  locale: AppLocale,
) {
  return breadcrumbListJsonLd(
    steps.map((step) => ({
      name: step.label,
      url: localizedUrl(step.path, locale),
    })),
  );
}
