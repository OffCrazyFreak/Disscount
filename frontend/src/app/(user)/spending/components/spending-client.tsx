"use client";

import { PiggyBank } from "lucide-react";

import ComingSoon from "@/components/custom/common/coming-soon";
import LoginRequired from "@/components/custom/common/login-required";
import NotifyMeButton from "@/components/custom/common/notify-me-button";
import { useUser } from "@/context/user-context";

export default function SpendingClient() {
  const { isAuthenticated, isLoading: userLoading } = useUser();

  if (!userLoading && !isAuthenticated) {
    return (
      <LoginRequired
        title="Potrošnja"
        description="Prijava ti omogućuje pregled potrošnje po trgovinama i kategorijama te praćenje ušteda kroz mjesece."
        icon={<PiggyBank className="size-12 text-primary" />}
      />
    );
  }

  return (
    <ComingSoon
      title="Potrošnja"
      icon={<PiggyBank className="size-12 text-primary" />}
      description="Vidjet ćeš koliko trošiš po trgovini i kategoriji, na kojim proizvodima najviše štediš i kako ti se potrošnja mijenja kroz mjesece."
      action={<NotifyMeButton />}
    />
  );
}
