import Image from "next/image";
import HealthStatus from "@/app/statistics/components/health-status";
import ChainList from "@/app/statistics/components/chain-list";

export default function StatisticsPage() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
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
      </div>

      <HealthStatus />

      <ChainList />
    </div>
  );
}
