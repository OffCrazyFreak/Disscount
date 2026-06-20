import { Metadata } from "next";
import DashboardGuard from "@/app/dashboard/components/dashboard-guard";
import DashboardContent from "@/app/dashboard/components/dashboard-content";

export const metadata: Metadata = {
  title: "Nadzorna ploča",
  description: "Nadzorna ploča za partnere, javni sektor i administratore.",
};

export default function DashboardPage() {
  return (
    <DashboardGuard>
      <DashboardContent />
    </DashboardGuard>
  );
}
