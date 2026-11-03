import type { Metadata, ResolvedMetadata } from "next";
import { X_HANDLE } from "@/constants/social";
import {
  DEFAULT_LOCALE,
  OPEN_GRAPH_LOCALES,
  type AppLocale,
} from "@/i18n/locales";
import { isIndexableOrigin } from "@/utils/indexing";
import { productPageUrl } from "@/utils/product-links";
import { clientEnv } from "@/lib/env";

interface IProductMetadataInput {
  ean: string;
  locale: AppLocale;
  title: string;
  description: string;
  photoUrl: string | null;
  /** The layout's resolved metadata, whose file-based brand image a page-level openGraph would drop */
  parent: Pick<ResolvedMetadata, "openGraph" | "twitter">;
}

/** Metadata for a product that exists; openGraph and twitter replace the layout's whole objects. */
export function productMetadata({
  ean,
  locale,
  title,
  description,
  photoUrl,
  parent,
}: IProductMetadataInput): Metadata {
  const url = productPageUrl(ean, locale);
  const photo = photoUrl ? [{ url: photoUrl, alt: title }] : null;

  return {
    // The layout template would prepend "Disscount - " to a product name.
    title: { absolute: title },
    description,
    // No hreflang: only the Croatian page is indexed, and Google ignores a set
    // whose other members are noindex.
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: OPEN_GRAPH_LOCALES[locale],
      siteName: "Disscount",
      url,
      title,
      description,
      images: photo ?? parent.openGraph?.images,
    },
    twitter: {
      card: "summary_large_image",
      site: X_HANDLE,
      creator: X_HANDLE,
      title,
      description,
      images: photo ?? parent.twitter?.images,
    },
    ...translatedProductRobots(locale),
  };
}

/**
 * Translations repeat the Croatian product data around translated boilerplate, which
 * Google treats as thin duplicates, so only Croatian is indexed.
 */
export function translatedProductRobots(locale: AppLocale): Metadata {
  if (locale === DEFAULT_LOCALE) return {};

  return {
    robots: {
      index: false,
      follow: isIndexableOrigin(clientEnv.NEXT_PUBLIC_APP_URL),
    },
  };
}
