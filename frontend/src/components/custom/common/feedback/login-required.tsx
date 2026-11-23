"use client";

import { ReactNode } from "react";
import { LogIn, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { openModalUrl } from "@/lib/modal/modal-navigation";

interface ILoginRequiredProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export default function LoginRequired({
  title,
  description,
  icon,
}: ILoginRequiredProps) {
  const t = useTranslations("common");

  return (
    <div className="space-y-6">
      {title && <h1 className="text-3xl font-bold text-pretty">{title}</h1>}

      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-16 px-6 text-center">
        {icon ?? <Lock className="size-12 text-primary" />}

        <p className="max-w-md text-pretty text-muted-foreground">
          {description ?? t("loginRequired.description")}
        </p>

        <Button
          effect="shineHover"
          icon={LogIn}
          iconPlacement="left"
          onClick={() => openModalUrl({ name: "login" })}
        >
          {t("loginRequired.action")}
        </Button>
      </div>
    </div>
  );
}
