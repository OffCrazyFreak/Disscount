"use client";

import { useTranslations } from "next-intl";
import { ListPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { openModalUrl } from "@/lib/modal/modal-navigation";

interface IAddPlainItemButtonProps {
  query: string;
  variant?: "primary" | "outline";
}

/** For a product the catalogue does not carry, or one the results only come close to. */
export default function AddPlainItemButton({
  query,
  variant = "primary",
}: IAddPlainItemButtonProps) {
  const t = useTranslations("products");
  const itemName = query.trim();

  if (!itemName) return null;

  return (
    <Button
      type="button"
      variant={variant}
      effect={variant === "primary" ? "shineHover" : undefined}
      className="max-w-full"
      onClick={() => openModalUrl({ name: "add-plain-item", itemName })}
    >
      <ListPlus aria-hidden="true" className="size-5" />
      <span className="truncate">
        {t("list.addPlainItem", { query: itemName })}
      </span>
    </Button>
  );
}
