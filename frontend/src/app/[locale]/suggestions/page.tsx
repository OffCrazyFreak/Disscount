import { Metadata } from "next";

import SuggestionsClient from "@/app/[locale]/suggestions/components/suggestions-client";
import { readSearchParam } from "@/utils/generic";

export const metadata: Metadata = {
  title: "Ideje i prijedlozi",
  description: "Predloži nove značajke i glasaj za one koje želiš vidjeti.",
};

export default async function SuggestionsPage(
  props: PageProps<"/[locale]/suggestions">,
) {
  const query = readSearchParam(await props.searchParams);

  return <SuggestionsClient query={query} />;
}
