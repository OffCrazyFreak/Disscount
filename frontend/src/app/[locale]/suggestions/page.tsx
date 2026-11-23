import { Metadata } from "next";

import SuggestionsClient from "@/app/[locale]/suggestions/components/suggestions-client";
import { pageMetadata } from "@/i18n/alternates";
import { readSearchParam } from "@/utils/format/generic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("suggestions", "/suggestions");
}

export default async function SuggestionsPage(
  props: PageProps<"/[locale]/suggestions">,
) {
  const query = readSearchParam(await props.searchParams);

  return <SuggestionsClient query={query} />;
}
