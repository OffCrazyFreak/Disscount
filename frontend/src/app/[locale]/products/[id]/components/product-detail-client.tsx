"use client";

import { useIsRestoring } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import ProductInfoDisplay from "@/app/[locale]/products/components/product-info-display";
import PriceHistory from "@/app/[locale]/products/[id]/components/price-history/price-history-base";
import ProductChainsSection from "@/app/[locale]/products/[id]/components/product-chains-section";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import SectionTabs from "@/components/custom/common/section-tabs";
import { useProductDetail } from "@/app/[locale]/products/[id]/hooks/use-product-detail";

interface IProductDetailClientProps {
  ean: string;
}

export default function ProductDetailClient({
  ean,
}: IProductDetailClientProps) {
  const t = useTranslations("productDetail");
  const tSections = useTranslations("common.sectionNav");
  const detail = useProductDetail(ean);
  const { product, productLoading, productError } = detail;
  // Restoring queries report idle, not loading, and the server always restores; a product the server seeded is already cached, so it renders at once.
  const isRestoring = useIsRestoring();

  if (!product && (productLoading || isRestoring)) {
    return (
      <div className="grid place-items-center">
        <BlockLoadingSpinner />
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("notFound.title")}
          </h2>

          <p className="text-gray-600">{t("notFound.description")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section>
        <ProductInfoDisplay product={product} />
      </section>

      <SectionTabs
        label={t("sectionNav.label")}
        tabs={[
          {
            id: "stores",
            label: tSections("stores"),
            shortLabel: tSections("storesShort"),
            count: detail.sortedChains.length,
            content: <ProductChainsSection product={product} detail={detail} />,
          },
          {
            id: "price-history",
            label: tSections("priceHistory"),
            shortLabel: tSections("priceHistoryShort"),
            content: <PriceHistory key={product.ean} product={product} />,
          },
        ]}
      />
    </div>
  );
}
