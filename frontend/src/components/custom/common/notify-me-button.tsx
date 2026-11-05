"use client";

import { BellRing } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { openModalUrl } from "@/lib/modal/modal-navigation";

interface INotifyMeButtonProps {
  label?: string;
}

/**
 * Turns a coming-soon page into something you can act on, using the notification
 * preferences that already exist rather than a separate waitlist. Signed out, the
 * modal router gates this into login on its own.
 */
export default function NotifyMeButton({ label }: INotifyMeButtonProps) {
  const t = useTranslations("common.comingSoon");

  return (
    <Button
      type="button"
      effect="expandIcon"
      icon={BellRing}
      iconPlacement="left"
      onClick={() => openModalUrl({ name: "settings", tab: "obavijesti" })}
    >
      {label ?? t("notifyMe")}
    </Button>
  );
}
