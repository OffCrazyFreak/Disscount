package disscount.productimage;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One row per EAN: which photo is shown, how widely the product sells, and the admin's review state. */
@Entity
@Table(name = "product_image_set",
        indexes = @Index(name = "idx_product_image_set_listings", columnList = "store_listings"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImageSet {

    @Id
    @Column(length = 14)
    private String ean;

    @Column(length = 200)
    private String name;

    @Column(length = 120)
    private String brand;

    /** Store prices listed for this EAN in the latest cijene archive, the popularity used for the review queue. */
    @Builder.Default
    @Column(name = "store_listings", nullable = false)
    private int storeListings = 0;

    @Builder.Default
    @Column(name = "chain_count", nullable = false)
    private int chainCount = 0;

    @Column(name = "main_image_id")
    private UUID mainImageId;

    /** Set when the admin chose the main photo; automatic picks never replace it. */
    @Builder.Default
    @Column(nullable = false)
    private boolean pinned = false;

    /** A new user photo or report arrived since the admin last looked. */
    @Builder.Default
    @Column(name = "needs_review", nullable = false)
    private boolean needsReview = false;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by_id")
    private UUID reviewedById;

    @Column(name = "off_details_fetched_at")
    private LocalDateTime offDetailsFetchedAt;
}
