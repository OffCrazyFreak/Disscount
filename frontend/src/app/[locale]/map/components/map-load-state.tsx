"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

interface IMapLoadStateProps {
  status: "pending" | "error" | "success";
  onRetry: () => void;
}

/** Shown in the panel while the store list loads, or when it failed. */
export default function MapLoadState({ status, onRetry }: IMapLoadStateProps) {
  const t = useTranslations("map.load");

  if (status === "error") {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 p-6 text-center text-sm"
      >
        <p>{t("error")}</p>

        <Button type="button" variant="outline" onClick={onRetry}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground"
    >
      <Loader2
        className="size-4 animate-spin motion-reduce:animate-none"
        aria-hidden="true"
      />
      {t("loading")}
    </div>
  );
}
