"use client";

import {
  CheckCheck,
  CloudDownload,
  ExternalLink,
  ImagePlus,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  useMarkProductReviewed,
  useRefreshFromOpenFoodFacts,
} from "@/lib/api/product-images/admin-hooks";
import { problemMessage } from "@/lib/api/problem-details";
import type { AdminProductPhotos } from "@/lib/api/types";
import { parseServerDate } from "@/utils/date";
import { productPath } from "@/utils/product-links";

interface IPhotoManagerHeaderProps {
  product: AdminProductPhotos;
  name: string;
  onAdd: () => void;
  onReviewed?: () => void;
}

export default function PhotoManagerHeader({
  product,
  name,
  onAdd,
  onReviewed,
}: IPhotoManagerHeaderProps) {
  const t = useTranslations("productPhotos");
  const format = useFormatter();
  const refresh = useRefreshFromOpenFoodFacts(product.ean);
  const reviewed = useMarkProductReviewed(product.ean);
  const onError = (error: Error) =>
    toast.error(problemMessage(error, t("manager.actionFailed")));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 lang="hr" className="text-lg font-bold text-pretty">
            {name}
          </h2>
          <p className="font-mono text-xs text-muted-foreground">
            {t("manager.ean", { ean: product.ean })} ·{" "}
            {t("manager.listings", { count: product.storeListings })} ·{" "}
            {t("manager.chains", { count: product.chainCount })}
          </p>
          <p className="text-xs text-muted-foreground">
            {product.reviewedAt
              ? t("manager.reviewedAt", {
                  date: format.dateTime(parseServerDate(product.reviewedAt), {
                    dateStyle: "medium",
                  }),
                })
              : t("manager.notReviewed")}
            {product.pinned && <> · {t("manager.pinned")}</>}
          </p>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          icon={ExternalLink}
          iconPlacement="left"
        >
          <Link href={productPath(product.ean)}>
            {t("manager.openProduct")}
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          icon={CloudDownload}
          iconPlacement="left"
          loading={refresh.isPending}
          onClick={() =>
            refresh.mutate(undefined, {
              onSuccess: () => toast.success(t("manager.refreshed")),
              onError,
            })
          }
        >
          {t("manager.refresh")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={ImagePlus}
          iconPlacement="left"
          onClick={onAdd}
        >
          {t("photo.add")}
        </Button>
        <Button
          size="sm"
          icon={CheckCheck}
          iconPlacement="left"
          loading={reviewed.isPending}
          onClick={() =>
            reviewed.mutate(undefined, {
              onSuccess: () => onReviewed?.(),
              onError,
            })
          }
        >
          {onReviewed ? t("queue.reviewedNext") : t("manager.markReviewed")}
        </Button>
      </div>
    </div>
  );
}
