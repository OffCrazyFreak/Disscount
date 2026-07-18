import { Metadata } from "next";
import { Wallet } from "lucide-react";

import ComingSoon from "@/components/custom/common/coming-soon";

export const metadata: Metadata = {
  title: "Potrošnja",
  description: "Pregled i analiza vaše potrošnje.",
};

export default function SpendingPage() {
  return (
    <ComingSoon
      title="Potrošnja"
      icon={<Wallet className="size-12 text-primary" />}
      description="Pregled i analiza vaše potrošnje uskoro će biti dostupni."
    />
  );
}
