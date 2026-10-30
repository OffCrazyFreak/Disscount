"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import { isAdmin } from "@/lib/api/schemas/auth-user";

export default function NewPostButton() {
  const t = useTranslations("updates");
  const { user } = useUser();

  if (!isAdmin(user?.accountType)) return null;

  return (
    <Button
      effect="shineHover"
      icon={Plus}
      iconPlacement="left"
      onClick={() => toast.info(t("newPostSoon"))}
    >
      {t("newPost")}
    </Button>
  );
}
