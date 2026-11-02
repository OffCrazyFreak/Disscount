package disscount.productImage.dao;

import java.util.List;

import disscount.productImage.domain.ImageStatus;
import disscount.productImage.domain.ProductImageSet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductImageSetRepository extends JpaRepository<ProductImageSet, String> {

    @Query("select s.ean from ProductImageSet s")
    List<String> findAllEans();

    /** EANs some chain priced in the latest catalogue import; a product that left every chain drops to 0. */
    @Query("select s.ean from ProductImageSet s where s.chainCount > 0 order by s.ean")
    List<String> findListedEans();

    @Query("""
            select s from ProductImageSet s
            where s.reviewedAt is null or s.needsReview = true
            order by s.storeListings desc, s.ean
            """)
    Page<ProductImageSet> findToReview(Pageable page);

    @Query("""
            select s from ProductImageSet s
            where exists (select 1 from ProductImage i where i.ean = s.ean and i.status = :pending)
            order by s.storeListings desc, s.ean
            """)
    Page<ProductImageSet> findWithPending(@Param("pending") ImageStatus pending, Pageable page);

    @Query("""
            select s from ProductImageSet s
            where exists (select 1 from ProductImage i
                          where i.ean = s.ean and i.reportCount > 0 and i.status <> :hidden)
            order by s.storeListings desc, s.ean
            """)
    Page<ProductImageSet> findWithReports(@Param("hidden") ImageStatus hidden, Pageable page);

    @Query("select count(s) from ProductImageSet s where s.reviewedAt is not null")
    long countReviewed();
}
