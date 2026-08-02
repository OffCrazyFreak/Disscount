import SectionHeaderSkeleton from "@/components/custom/skeleton/section-header-skeleton";
import ProductChainsListSkeleton from "@/app/products/[id]/components/product-chains-list-skeleton";

interface IProductChainsSectionSkeletonProps {
  chains?: number;
}

/** Mirrors ProductChainsSection, open, since that is its stored default. */
export default function ProductChainsSectionSkeleton({
  chains,
}: IProductChainsSectionSkeletonProps) {
  return (
    <div>
      <SectionHeaderSkeleton title="Cijene po lancima trgovina" />
      <ProductChainsListSkeleton chains={chains} />
    </div>
  );
}
