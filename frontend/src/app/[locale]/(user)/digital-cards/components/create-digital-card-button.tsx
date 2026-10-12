"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import ResponsiveLabel from "@/components/custom/common/responsive-label";

interface ICreateDigitalCardButtonProps {
  onCreateClick: () => void;
}

export default function CreateDigitalCardButton({
  onCreateClick,
}: ICreateDigitalCardButtonProps) {
  const t = useTranslations("digitalCards");
  const buttonText = t("actions.add");

  return (
    <>
      <Button
        type="button"
        effect="expandIcon"
        onClick={onCreateClick}
        icon={Plus}
        iconPlacement="left"
      >
        <ResponsiveLabel full={buttonText} short={t("actions.addShort")} />
      </Button>
    </>
  );
}
