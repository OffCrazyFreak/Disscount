import { useLocale, useTranslations } from "next-intl";

import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { getNewestPriceDate } from "@/utils/price/product-price-utils";
import { formatDate } from "@/utils/format/strings";

interface IPricesPublishedOnProps {
  product: ProductResponse;
}

/** The same day the JSON-LD sends as dateModified, so readers and crawlers see one freshness date. */
export default function PricesPublishedOn({
  product,
}: IPricesPublishedOnProps) {
  const t = useTranslations("productDetail.chains");
  const locale = useLocale();
  const publishedOn = getNewestPriceDate(product);

  if (!publishedOn) return null;

  return (
    <p className="text-xs text-muted-foreground">
      {t("publishedOn", { date: formatDate(publishedOn, locale) })}
    </p>
  );
}
