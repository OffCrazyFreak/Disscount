import { Metadata } from "next";
import { Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";

import ComingSoon from "@/components/custom/coming-soon";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.spending");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function SpendingPage() {
  const t = await getTranslations("pages.spending");

  return (
    <ComingSoon
      title={t("title")}
      icon={<Wallet className="size-12 text-primary" />}
      description={t("comingSoonDescription")}
    />
  );
}
