import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import DashboardGuard from "@/app/dashboard/components/dashboard-guard";
import DashboardContent from "@/app/dashboard/components/dashboard-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.dashboard");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default function DashboardPage() {
  return (
    <DashboardGuard>
      <DashboardContent />
    </DashboardGuard>
  );
}
