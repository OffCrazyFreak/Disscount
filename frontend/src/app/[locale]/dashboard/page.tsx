import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { pageAlternates } from "@/i18n/alternates";
import DashboardGuard from "@/app/[locale]/dashboard/components/dashboard-guard";
import DashboardContent from "@/app/[locale]/dashboard/components/dashboard-content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("dashboard");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: pageAlternates("/dashboard", locale),
  };
}

export default function DashboardPage() {
  return (
    <DashboardGuard>
      <DashboardContent />
    </DashboardGuard>
  );
}
