import type { Metadata, ResolvingMetadata } from "next";

import { X_HANDLE } from "@/constants/social";

interface ISharedPageMetadata extends Metadata {
  title: string;
  description: string;
  alternates: { canonical: string };
}

/** A child's title never reaches the layout's openGraph, and a page openGraph drops the parent image. */
export async function withSharePreview(
  metadata: ISharedPageMetadata,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { openGraph, twitter } = await parent;
  // The same text the layout's "Disscount - %s" template puts in <title>.
  const title = `Disscount - ${metadata.title}`;
  const { description } = metadata;

  return {
    ...metadata,
    openGraph: {
      type: "website",
      locale: openGraph?.locale,
      siteName: "Disscount",
      url: metadata.alternates.canonical,
      title,
      description,
      images: openGraph?.images,
    },
    twitter: {
      card: "summary_large_image",
      site: X_HANDLE,
      creator: X_HANDLE,
      title,
      description,
      images: twitter?.images,
    },
  };
}
