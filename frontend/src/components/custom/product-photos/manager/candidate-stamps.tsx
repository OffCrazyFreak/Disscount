import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { AdminProductImage } from "@/lib/api/types";

interface ICandidateStampsProps {
  image: AdminProductImage;
  source: string;
  status: string;
}

export default function CandidateStamps({
  image,
  source,
  status,
}: ICandidateStampsProps) {
  const t = useTranslations("productPhotos");

  return (
    <>
      <div className="pointer-events-none absolute inset-x-1.5 top-1.5 flex flex-wrap gap-1 font-mono text-[10px] font-semibold tracking-wide uppercase">
        <span className="rounded bg-neutral-900/80 px-1.5 py-0.5 text-white">
          {source}
        </span>
        {image.status !== "VERIFIED" && (
          <span
            className={cn(
              "rounded px-1.5 py-0.5",
              image.status === "PENDING"
                ? "bg-amber-200 text-amber-900"
                : "bg-neutral-200 text-neutral-800",
            )}
          >
            {status}
          </span>
        )}
        {image.reportCount > 0 && (
          <span className="rounded bg-red-600 px-1.5 py-0.5 text-white">
            {t("manager.reports", { count: image.reportCount })}
          </span>
        )}
      </div>
      {image.main && (
        <span className="absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
          <Star aria-hidden="true" className="size-3" fill="currentColor" />
          {t("manager.main")}
        </span>
      )}
    </>
  );
}
