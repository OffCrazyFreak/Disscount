"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResponsiveLabel from "@/components/custom/common/responsive-label";

interface ICreateDigitalCardButtonProps {
  onCreateClick: () => void;
}

export default function CreateDigitalCardButton({
  onCreateClick,
}: ICreateDigitalCardButtonProps) {
  const buttonText = "Dodaj digitalnu karticu";

  return (
    <>
      <Button
        type="button"
        effect="expandIcon"
        onClick={onCreateClick}
        icon={Plus}
        iconPlacement="left"
        aria-label={buttonText}
      >
        <ResponsiveLabel full={buttonText} short="Dodaj karticu" />
      </Button>
    </>
  );
}
