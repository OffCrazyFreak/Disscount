"use client";

import { BellRing } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { openModalUrl } from "@/lib/modal/modal-navigation";

/** Uses notification preferences instead of a waitlist; the modal router gates signed-out visitors. */
export default function NotifyMeButton() {
  const t = useTranslations("common.comingSoon");

  return (
    <Button
      type="button"
      effect="expandIcon"
      icon={BellRing}
      iconPlacement="left"
      onClick={() => openModalUrl({ name: "settings", tab: "obavijesti" })}
    >
      {t("notifyMe")}
    </Button>
  );
}
