import { useTranslations } from "next-intl";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import type { ProductResponse, StorePrice } from "@/lib/cijene-api/schemas";
import StorePricesTable from "@/app/[locale]/products/[id]/components/store-item/store-prices-table";

export type StorePricesStatus = "pending" | "error" | "success";

interface IStorePricesDetailsProps {
  storePrices: StorePrice[];
  status: StorePricesStatus;
  product: ProductResponse;
}

/** A chain's per-store prices, or why they are not here yet. */
export default function StorePricesDetails({
  storePrices,
  status,
  product,
}: IStorePricesDetailsProps) {
  const t = useTranslations("productDetail.chains");

  if (status === "pending") {
    return (
      <div className="grid place-items-center">
        <BlockLoadingSpinner />
      </div>
    );
  }

  if (status === "error") {
    return <p className="p-2 text-gray-600 text-center">{t("loadError")}</p>;
  }

  return <StorePricesTable storePrices={storePrices} product={product} />;
}
