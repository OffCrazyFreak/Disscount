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
