"use client";

import { BellRing } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { openModalUrl } from "@/lib/modal/modal-navigation";

interface INotifyMeButtonProps {
  label?: string;
}

/** Uses the existing notification preferences rather than a separate waitlist; the modal router gates signed-out visitors into login. */
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
