import { Metadata } from "next";
import { pageMetadata } from "@/i18n/alternates";
import DashboardGuard from "@/app/[locale]/dashboard/components/dashboard-guard";
import DashboardContent from "@/app/[locale]/dashboard/components/dashboard-content";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("dashboard", "/dashboard");
}

export default function DashboardPage() {
  return (
    <DashboardGuard>
      <DashboardContent />
    </DashboardGuard>
  );
}
