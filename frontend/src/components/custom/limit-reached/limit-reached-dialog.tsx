"use client";

import { useSyncExternalStore } from "react";
import { CircleAlert, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/components/custom/modal/confirm-dialog";
import {
  dismissLimitReached,
  getLimitReached,
  getServerLimitReached,
  subscribeLimitReached,
} from "@/lib/limits/limit-reached-store";
import { openModalUrl } from "@/lib/modal/modal-navigation";

export default function LimitReachedDialog() {
  const t = useTranslations("ui.limitReached");
  const { open, problem } = useSyncExternalStore(
    subscribeLimitReached,
    getLimitReached,
    getServerLimitReached,
  );

  if (!problem) return null;

  function contactSupport() {
    dismissLimitReached();
    openModalUrl({ name: "contact" });
  }

  return (
    <ConfirmDialog
      isOpen={open}
      onOpenChange={(isOpen) => !isOpen && dismissLimitReached()}
      title={t("title")}
      description={`${t(`description.${problem.limit}`, { max: problem.max })} ${t("contactHint")}`}
      icon={CircleAlert}
      confirmIcon={Mail}
      confirmLabel={t("contact")}
      cancelLabel={t("close")}
      onConfirm={contactSupport}
    />
  );
}
