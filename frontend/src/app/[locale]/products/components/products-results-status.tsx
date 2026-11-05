import { useFormatter, useTranslations } from "next-intl";

interface IProductsResultsStatusProps {
  query: string;
  isPending: boolean;
  hasError: boolean;
  total: number;
  isTruncated: boolean;
  /** Places with no price for a search that matches elsewhere, empty otherwise */
  noPriceLocations: string[];
}

/**
 * Announces the result count to screen readers only. The region stays mounted
 * and empties while loading, so every settled search is read out again.
 */
export default function ProductsResultsStatus({
  query,
  isPending,
  hasError,
  total,
  isTruncated,
  noPriceLocations,
}: IProductsResultsStatusProps) {
  const t = useTranslations("products.list");
  const format = useFormatter();
  const hasSettledResults = Boolean(query) && !isPending && !hasError;

  if (hasSettledResults && total === 0 && noPriceLocations.length > 0) {
    return (
      <p role="status" className="sr-only">
        {t("noPriceInLocationsText", {
          count: noPriceLocations.length,
          locations: format.list(noPriceLocations, { type: "conjunction" }),
        })}
      </p>
    );
  }

  return (
    <p role="status" className="sr-only">
      {hasSettledResults &&
        t("resultsStatus", {
          count: total,
          // The cap applies before filters, so a filtered-out search can be capped yet empty
          truncated: isTruncated && total > 0 ? "yes" : "no",
        })}
    </p>
  );
}
