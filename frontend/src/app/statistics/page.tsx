import Image from "next/image";
import HealthStatus from "@/app/statistics/components/health-status";
import ChainList from "@/app/statistics/components/stores-list";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.statistics");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function StatisticsPage() {
  const t = await getTranslations("pages.statistics");
  const tCommon = await getTranslations("common");

  return (
    <div className="space-y-6">
      <div className="text-center mb-8 space-y-4">
        <div className="flex items-center justify-center space-x-4">
          {/* App logo */}
          <Image
            src="/disscount-logo.png"
            alt={tCommon("logoAlt")}
            width={128}
            height={128}
            className="size-16"
          />
          <h1 className="text-3xl font-bold">
            <span className="text-primary">Disscount</span> {t("heading")}
          </h1>
        </div>

        <p className="text-pretty text-md sm:text-lg">{t("description")}</p>
      </div>

      <HealthStatus />

      <ChainList />
    </div>
  );
}
