import type { Metadata, ResolvingMetadata } from "next";
import { withSharePreview } from "@/utils/seo/share-metadata";

import SuggestionsClient from "@/app/[locale]/suggestions/components/suggestions-client";
import { pageMetadata } from "@/i18n/alternates";
import { readSearchParam } from "@/utils/format/generic";

export async function generateMetadata(
  _props: PageProps<"/[locale]/suggestions">,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  return withSharePreview(
    await pageMetadata("suggestions", "/suggestions"),
    parent,
  );
}

export default async function SuggestionsPage(
  props: PageProps<"/[locale]/suggestions">,
) {
  const query = readSearchParam(await props.searchParams);

  return <SuggestionsClient query={query} />;
}
