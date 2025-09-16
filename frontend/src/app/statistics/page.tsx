import Image from "next/image";
import HealthStatus from "@/app/statistics/components/health-status";
import ChainList from "@/app/statistics/components/stores-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statistika",
  description: "Pregled statistike lanaca trgovina.",
};

export default function StatisticsPage() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8 space-y-4">
        <div className="flex items-center justify-center space-x-4">
          {/* App logo */}
          <Image
            src="/disscount-logo.png"
            alt="Disscount logo"
            width={128}
            height={128}
            className="size-16"
          />
          <h1 className="text-3xl font-bold">
            <span className="text-primary">Disscount</span> Statistika
          </h1>
        </div>

        <p className="text-pretty text-md sm:text-lg">
          Pregled statistike lanaca trgovina.
        </p>
      </div>

      <HealthStatus />

      <ChainList />
    </div>
  );
}
