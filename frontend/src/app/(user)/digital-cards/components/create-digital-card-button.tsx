"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackToTopButton from "@/components/custom/fab/back-to-top-button";

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
        className="w-full sm:w-auto"
      >
        {buttonText}
      </Button>

      <BackToTopButton />
    </>
  );
}
