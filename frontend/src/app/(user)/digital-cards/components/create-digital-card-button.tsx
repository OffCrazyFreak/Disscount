"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageFab from "@/components/custom/fab/page-fab";

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
        className="hidden sm:inline-flex"
      >
        {buttonText}
      </Button>

      <PageFab
        primary={{ icon: Plus, label: buttonText, onClick: onCreateClick }}
      />
    </>
  );
}
