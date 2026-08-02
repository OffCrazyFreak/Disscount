import SkeletonRegion from "@/components/custom/skeleton/skeleton-region";
import SectionHeaderSkeleton from "@/components/custom/skeleton/section-header-skeleton";
import ProductInfoDisplaySkeleton from "@/app/products/components/product-info-display-skeleton";
import ProductChainsSectionSkeleton from "@/app/products/[id]/components/product-chains-section-skeleton";

/**
 * The whole product detail page, in the same `space-y-4` rhythm as
 * product-detail-client. Shared by loading.tsx and the client's pending branch,
 * so it takes no hooks and no context.
 */
export default function ProductDetailSkeleton() {
  return (
    <SkeletonRegion className="space-y-4" label="Učitavanje proizvoda">
      <section>
        <ProductInfoDisplaySkeleton />
      </section>

      {/* Price history is stored closed by default, so its header is the whole
          footprint until someone opens it. */}
      <section>
        <SectionHeaderSkeleton title="Povijest cijena" />
      </section>

      <section>
        <ProductChainsSectionSkeleton />
      </section>
    </SkeletonRegion>
  );
}
