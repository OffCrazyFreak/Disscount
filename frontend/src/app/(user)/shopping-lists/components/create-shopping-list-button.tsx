"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FloatingActionButton } from "@/components/custom/floating-action-button";

interface CreateShoppingListButtonProps {
  onCreateClick: () => void;
}

export default function CreateShoppingListButton({
  onCreateClick,
}: CreateShoppingListButtonProps) {
  const t = useTranslations("pages.shoppingLists");
  const buttonText = t("create");

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

      <FloatingActionButton
        onClick={onCreateClick}
        icon={<Plus size={24} />}
        label={buttonText}
        className="sm:hidden"
      />
    </>
  );
}
