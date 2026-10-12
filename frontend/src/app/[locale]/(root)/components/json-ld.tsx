import { getLocale, getTranslations } from "next-intl/server";
import { faqIds } from "@/app/[locale]/(root)/data/faq";
import { appUrl } from "@/lib/env";

const baseUrl = appUrl();

async function buildGraph() {
  const locale = await getLocale();
  const t = await getTranslations("landing");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        name: "Disscount",
        url: `${baseUrl}/`,
        inLanguage: locale,
        publisher: { "@id": `${baseUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${baseUrl}/products?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: "Disscount",
        url: `${baseUrl}/`,
        logo: `${baseUrl}/brand/logo/cart/cart-rgb.svg`,
        sameAs: [
          "https://x.com/disscountme",
          "https://www.linkedin.com/company/disscountme",
        ],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${baseUrl}/#app`,
        name: "Disscount",
        applicationCategory: "ShoppingApplication",
        operatingSystem: "Web, Android, iOS",
        inLanguage: locale,
        description: t("jsonLd.appDescription"),
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        screenshot: [
          `${baseUrl}/screenshots/screenshot-narrow.png`,
          `${baseUrl}/screenshots/screenshot-wide.png`,
        ],
        author: { "@id": `${baseUrl}/#organization` },
      },
      {
        "@type": "FAQPage",
        "@id": `${baseUrl}/#faq`,
        inLanguage: locale,
        mainEntity: faqIds.map((id) => ({
          "@type": "Question",
          name: t(`faq.items.${id}.question`),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(`faq.items.${id}.answer`),
          },
        })),
      },
    ],
  };
}

export default async function LandingJsonLd() {
  const graph = await buildGraph();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph).replace(/</g, "\\u003c"),
      }}
    />
  );
}
