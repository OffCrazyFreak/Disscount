import type { Metadata, ResolvingMetadata } from "next";
import { withSharePreview } from "@/utils/share-metadata";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import SuggestionDetailsClient from "@/app/[locale]/suggestions/[id]/components/suggestion-details-client";
import { getSuggestionById } from "@/app/[locale]/suggestions/suggestions";
import { pageAlternates } from "@/i18n/alternates";

export async function generateMetadata(
  props: PageProps<"/[locale]/suggestions/[id]">,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await props.params;
  const locale = await getLocale();
  const t = await getTranslations("suggestions");

  return withSharePreview(
    {
      title: t("meta.detailTitle"),
      description: t("meta.detailDescription"),
      alternates: pageAlternates(`/suggestions/${id}`, locale),
    },
    parent,
  );
}

export default async function SuggestionDetailPage(
  props: PageProps<"/[locale]/suggestions/[id]">,
) {
  const { id } = await props.params;
  const suggestion = getSuggestionById(id);

  if (!suggestion) {
    notFound();
  }

  return <SuggestionDetailsClient suggestion={suggestion} />;
}
