package disscount.productImage.dao;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import disscount.productImage.domain.ImageSource;
import disscount.productImage.domain.ImageStatus;
import disscount.productImage.domain.ProductImage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductImageRepository extends JpaRepository<ProductImage, UUID> {

    List<ProductImage> findByEanOrderByCreatedAtAsc(String ean);

    Optional<ProductImage> findByEanAndSourceAndExternalKey(String ean, ImageSource source, String externalKey);

    List<ProductImage> findByEanAndStatusAndContributorIdNot(String ean, ImageStatus status, UUID contributorId);

    List<ProductImage> findByEanIn(Collection<String> eans);

    boolean existsByFullKey(String fullKey);

    boolean existsByThumbKey(String thumbKey);

    boolean existsBySmallKey(String smallKey);

    @Query("""
            select i from ProductImage i, ProductImageSet s
            where s.ean in :eans and i.id = s.mainImageId and i.thumbKey is not null
              and i.status in :visible
            """)
    List<ProductImage> findShownMainImages(@Param("eans") Collection<String> eans,
                                           @Param("visible") Collection<ImageStatus> visible);

    /** Main photos still waiting to be copied from Open Food Facts, most widely sold first. */
    @Query("""
            select i from ProductImage i, ProductImageSet s
            where i.id = s.mainImageId and i.fullKey is null and i.status = :candidate
              and (i.renderRetryAt is null or i.renderRetryAt <= :now)
            order by s.storeListings desc
            """)
    List<ProductImage> findUnrenderedMains(@Param("candidate") ImageStatus candidate, @Param("now") LocalDateTime now,
                                           Pageable page);
}
