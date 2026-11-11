package disscount.productimage;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

public interface ProductImageRepository extends JpaRepository<ProductImage, UUID> {

    List<ProductImage> findByEanOrderByCreatedAtAsc(String ean);

    Optional<ProductImage> findByEanAndSourceAndExternalKey(String ean, ImageSource source, String externalKey);

    List<ProductImage> findByEanAndStatusAndContributorIdNot(String ean, ImageStatus status, UUID contributorId);

    List<ProductImage> findByEanIn(Collection<String> eans);

    boolean existsByFullKey(String fullKey);

    // REQUIRES_NEW because an after-rollback callback joining the finished transaction could not read.
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    @Query("""
            select count(i) > 0 from ProductImage i
            where i.originalKey = :key or i.fullKey = :key or i.thumbKey = :key or i.smallKey = :key
            """)
    boolean anyRowPointsAt(@Param("key") String key);

    boolean existsByThumbKey(String thumbKey);

    boolean existsBySmallKey(String smallKey);

    boolean existsByContentSha256AndDeletedAtIsNotNull(String contentSha256);

    List<ProductImage> findByContributorId(UUID contributorId);

    List<ProductImage> findByConfirmedById(UUID confirmedById);

    @Query("""
            select i.contributorId as userId, count(i) as uploaded,
                   sum(case when i.deletedAt is not null then 1 else 0 end) as deleted
            from ProductImage i
            where i.contributorId is not null
            group by i.contributorId
            """)
    List<ContributorCount> countByContributor();

    interface ContributorCount {
        UUID getUserId();

        long getUploaded();

        long getDeleted();
    }

    @Query("""
            select i from ProductImage i, ProductImageSet s
            where s.ean in :eans and i.id = s.mainImageId and i.fullKey is not null
              and i.status in :visible
            """)
    List<ProductImage> findShownMainImages(@Param("eans") Collection<String> eans,
                                           @Param("visible") Collection<ImageStatus> visible);

    @Query("""
            select i from ProductImage i, ProductImageSet s
            where i.id = s.mainImageId and i.fullKey is null and i.status = :candidate
              and (i.renderRetryAt is null or i.renderRetryAt <= :now)
            order by s.storeListings desc
            """)
    List<ProductImage> findUnrenderedMains(@Param("candidate") ImageStatus candidate, @Param("now") LocalDateTime now,
                                           Pageable page);

    /** Shown photos rendered before the 1600 pixel full file existed, most widely sold first. */
    @Query("""
            select i from ProductImage i, ProductImageSet s
            where s.ean = i.ean and i.fullKey is not null and i.fullWidth is null and i.status in :visible
              and (i.renderAttempts is null or i.renderAttempts < :maxAttempts)
              and (i.renderRetryAt is null or i.renderRetryAt <= :now)
            order by s.storeListings desc
            """)
    List<ProductImage> findRenderedBeforeCurrentFiles(@Param("visible") Collection<ImageStatus> visible,
                                                    @Param("maxAttempts") int maxAttempts,
                                                    @Param("now") LocalDateTime now, Pageable page);
}
