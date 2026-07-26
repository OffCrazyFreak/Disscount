"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackToTopButton from "@/components/custom/fab/back-to-top-button";
import ResponsiveLabel from "@/components/custom/common/responsive-label";

interface ICreateShoppingListButtonProps {
  onCreateClick: () => void;
}

export default function CreateShoppingListButton({
  onCreateClick,
}: ICreateShoppingListButtonProps) {
  const buttonText = "Stvori popis za kupnju";

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
        <ResponsiveLabel full={buttonText} short="Stvori popis" />
      </Button>

      <BackToTopButton />
    </>
  );
}
