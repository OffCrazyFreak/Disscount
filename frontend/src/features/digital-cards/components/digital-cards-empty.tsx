"use client";

import { CreditCard, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { openModalUrl } from "@/lib/modal/modal-navigation";

export default function DigitalCardsEmpty() {
  const t = useTranslations("digitalCards");

  return (
    <div className="py-12 text-center">
      <CreditCard
        aria-hidden="true"
        className="mx-auto mb-4 size-12 text-gray-400"
      />

      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {t("empty.title")}
      </h3>

      <p className="mb-6 text-gray-600">{t("empty.description")}</p>

      <Button
        effect="shineHover"
        icon={Plus}
        iconPlacement="left"
        onClick={() => openModalUrl({ name: "digital-card", action: "new" })}
      >
        {t("empty.add")}
      </Button>
    </div>
  );
}
