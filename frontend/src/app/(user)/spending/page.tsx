import { Metadata } from "next";
import { PiggyBank } from "lucide-react";

import ComingSoon from "@/components/custom/common/coming-soon";
import NotifyMeButton from "@/components/custom/common/notify-me-button";

export const metadata: Metadata = {
  title: "Potrošnja",
  description: "Pregled i analiza tvoje potrošnje.",
};

export default function SpendingPage() {
  return (
    <ComingSoon
      title="Potrošnja"
      icon={<PiggyBank className="size-12 text-primary" />}
      description="Vidjet ćeš koliko trošiš po trgovini i kategoriji, na kojim proizvodima najviše štediš i kako ti se potrošnja mijenja kroz mjesece."
      action={<NotifyMeButton />}
    />
  );
}
