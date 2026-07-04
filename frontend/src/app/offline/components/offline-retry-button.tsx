"use client";

import { RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function OfflineRetryButton() {
  const t = useTranslations("pages.offline");

  return (
    <Button effect="shineHover" onClick={() => window.location.reload()}>
      <RotateCw className="size-4" />
      {t("retry")}
    </Button>
  );
}
