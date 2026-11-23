import CartLogo from "@/components/icons/cart-logo";
import HealthStatus from "@/app/[locale]/statistics/components/health-status";
import ChainList from "@/app/[locale]/statistics/components/stores-list";
import type { Metadata, ResolvingMetadata } from "next";
import { withSharePreview } from "@/utils/share-metadata";
import { getLocale, getTranslations } from "next-intl/server";
import { pageAlternates } from "@/i18n/alternates";

export async function generateMetadata(
  _props: PageProps<"/[locale]/statistics">,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("statistics");

  return withSharePreview(
    {
      title: t("meta.title"),
      description: t("meta.description"),
      alternates: pageAlternates("/statistics", locale),
    },
    parent,
  );
}

export default async function StatisticsPage() {
  const t = await getTranslations("statistics");

  return (
    <div className="space-y-6">
      <div className="text-center mb-8 space-y-4">
        <div className="flex items-center justify-center space-x-4">
          <CartLogo className="size-20 text-primary" />
          <h1 className="text-3xl font-bold">
            <span className="text-primary">Disscount</span> {t("page.title")}
          </h1>
        </div>

        <p className="text-pretty text-md sm:text-lg">{t("page.subtitle")}</p>
      </div>

      <HealthStatus />

      <ChainList />
    </div>
  );
}
