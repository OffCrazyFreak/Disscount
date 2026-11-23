"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import ResponsiveLabel from "@/components/custom/common/responsive-label";

interface ICreateShoppingListButtonProps {
  onCreateClick: () => void;
}

export default function CreateShoppingListButton({
  onCreateClick,
}: ICreateShoppingListButtonProps) {
  const t = useTranslations("shoppingLists");

  return (
    <>
      <Button
        type="button"
        effect="expandIcon"
        onClick={onCreateClick}
        icon={Plus}
        iconPlacement="left"
      >
        <ResponsiveLabel
          full={t("createList.full")}
          short={t("createList.short")}
        />
      </Button>
    </>
  );
}
