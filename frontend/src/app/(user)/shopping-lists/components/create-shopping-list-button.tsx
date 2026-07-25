"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackToTopButton from "@/components/custom/fab/back-to-top-button";

interface ICreateShoppingListButtonProps {
  onCreateClick: () => void;
}

export default function CreateShoppingListButton({
  onCreateClick,
}: ICreateShoppingListButtonProps) {
  const buttonText = "Stvori popis za kupnju";

  return (
    <>
      {/* Visible at every width: with the FAB gone a hold would be the only
          other way to create, and a gesture-only action fails WCAG 2.1.1. */}
      <Button
        type="button"
        effect="expandIcon"
        onClick={onCreateClick}
        icon={Plus}
        iconPlacement="left"
      >
        {buttonText}
      </Button>

      <BackToTopButton containerClassName="hidden md:block" />
    </>
  );
}
