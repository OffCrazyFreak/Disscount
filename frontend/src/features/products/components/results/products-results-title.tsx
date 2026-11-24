import { useTranslations } from "next-intl";

interface IProductsResultsTitleProps {
  query: string;
  /** The count belongs to this query, not to a search still loading */
  isSettled: boolean;
  total: number;
  isTruncated: boolean;
}

export default function ProductsResultsTitle({
  query,
  isSettled,
  total,
  isTruncated,
}: IProductsResultsTitleProps) {
  const t = useTranslations("products.list");

  if (!query) return <h3 />;

  return (
    <h3>
      {isSettled
        ? t("resultsTitleWithCount", {
            query,
            count: total,
            suffix: isTruncated ? "+" : "",
          })
        : t("resultsTitle", { query })}
    </h3>
  );
}
