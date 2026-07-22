import { Metadata } from "next";
import { PiggyBank } from "lucide-react";

import ComingSoon from "@/components/custom/common/coming-soon";

export const metadata: Metadata = {
  title: "Potrošnja",
  description: "Pregled i analiza tvoje potrošnje.",
};

export default function SpendingPage() {
  return (
    <ComingSoon
      title="Potrošnja"
      icon={<PiggyBank className="size-12 text-primary" />}
      description="Pregled i analiza tvoje potrošnje uskoro će biti dostupni."
    />
  );
}
