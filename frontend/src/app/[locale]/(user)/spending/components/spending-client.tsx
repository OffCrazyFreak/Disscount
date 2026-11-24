"use client";

import { PiggyBank } from "lucide-react";
import { useTranslations } from "next-intl";

import ComingSoon from "@/components/custom/common/feedback/coming-soon";
import LoginRequired from "@/components/custom/common/feedback/login-required";
import NotifyMeButton from "@/components/custom/common/controls/notify-me-button";
import { useUser } from "@/context/user-context";

export default function SpendingClient() {
  const t = useTranslations("spending");
  const { isAuthenticated, isLoading: userLoading } = useUser();

  if (!userLoading && !isAuthenticated) {
    return (
      <LoginRequired
        title={t("title")}
        description={t("loginRequired.description")}
        icon={<PiggyBank className="size-12 text-primary" />}
      />
    );
  }

  return (
    <ComingSoon
      title={t("title")}
      icon={<PiggyBank className="size-12 text-primary" />}
      description={t("comingSoon.description")}
      action={<NotifyMeButton />}
    />
  );
}
