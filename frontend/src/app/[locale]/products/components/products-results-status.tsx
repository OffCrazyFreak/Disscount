import { useTranslations } from "next-intl";

interface IProductsResultsStatusProps {
  query: string;
  isPending: boolean;
  hasError: boolean;
  total: number;
  isTruncated: boolean;
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
}: IProductsResultsStatusProps) {
  const t = useTranslations("products.list");
  const hasSettledResults = Boolean(query) && !isPending && !hasError;

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
