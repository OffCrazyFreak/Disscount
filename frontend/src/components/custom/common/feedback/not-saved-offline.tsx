"use client";

import { CloudOff } from "lucide-react";
import { useTranslations } from "next-intl";

interface INotSavedOfflineProps {
  title: string;
}

/** Shown offline on an account page this device never loaded, instead of an empty state. */
export default function NotSavedOffline({ title }: INotSavedOfflineProps) {
  const t = useTranslations("common");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-pretty">{title}</h1>

      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-16 px-6 text-center">
        <CloudOff aria-hidden="true" className="size-12 text-primary" />

        <p className="max-w-md text-pretty text-muted-foreground">
          {t("offline.notSaved")}
        </p>
      </div>
    </div>
  );
}
