import { getLocale, getTranslations } from "next-intl/server";

import type { ICategoryPriceFacts } from "@/app/[locale]/categories/utils/category-price-facts";
import { getChainLabel } from "@/utils/labels";
import { formatPrice } from "@/utils/price";

interface ICategoryIntroProps {
  productCount: number;
  /** Only page 1 carries prices, so later pages state the count alone. */
  facts: ICategoryPriceFacts | null;
}

export default async function CategoryIntro({
  productCount,
  facts,
}: ICategoryIntroProps) {
  const t = await getTranslations("categories");
  const locale = await getLocale();

  return (
    <p className="text-muted-foreground text-pretty">
      {t("intro.count", { count: productCount })}

      {facts && (
        <>
          {" "}
          {t("intro.prices", {
            chains: facts.chainCount,
            low: formatPrice(facts.lowAverage, locale),
            high: formatPrice(facts.highAverage, locale),
          })}{" "}
          {t("intro.cheapest", {
            chain: getChainLabel(facts.cheapest.chain),
            wins: facts.cheapest.wins,
            priced: facts.priced,
          })}
        </>
      )}
    </p>
  );
}
