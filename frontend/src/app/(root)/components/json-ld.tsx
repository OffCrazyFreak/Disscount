import { faqItems } from "@/app/(root)/data/faq";
import { appUrl } from "@/lib/env";

const baseUrl = appUrl();

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      name: "Disscount",
      url: `${baseUrl}/`,
      inLanguage: "hr",
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
      inLanguage: "hr",
      description:
        "Usporedba cijena proizvoda u trgovačkim lancima u Hrvatskoj: povijest cijena, pametni popisi za kupnju i praćenje proizvoda.",
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
      inLanguage: "hr",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

export default function LandingJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph).replace(/</g, "\\u003c"),
      }}
    />
  );
}
