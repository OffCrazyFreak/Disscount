package disscount.productImage.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import disscount.util.Timestamps;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "product_image",
        indexes = @Index(name = "idx_product_image_ean", columnList = "ean"),
        uniqueConstraints = @UniqueConstraint(name = "uq_product_image_external",
                columnNames = {"ean", "source", "external_key"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 14)
    private String ean;

    @Convert(converter = ImageSource.Column.class)
    @Column(nullable = false, length = 20)
    private ImageSource source;

    @Convert(converter = ImageStatus.Column.class)
    @Column(nullable = false, length = 12)
    private ImageStatus status;

    /** Open Food Facts image name: "front_hr" for a selected front, "raw:100" for an uploaded photo. */
    @Column(name = "external_key", length = 32)
    private String externalKey;

    /** Revision of a selected Open Food Facts image, part of its file name. */
    @Column(name = "external_rev", length = 16)
    private String externalRev;

    @Column(length = 8)
    private String lang;

    /** Sanitized upload in the private bucket; Open Food Facts photos are fetched again instead. */
    @Column(name = "original_key", length = 255)
    private String originalKey;

    @Column(name = "original_width")
    private Integer originalWidth;

    @Column(name = "original_height")
    private Integer originalHeight;

    @Builder.Default
    @Column(nullable = false)
    private int rotation = 0;

    @Column(name = "crop_x")
    private Integer cropX;

    @Column(name = "crop_y")
    private Integer cropY;

    @Column(name = "crop_width")
    private Integer cropWidth;

    @Column(name = "crop_height")
    private Integer cropHeight;

    @Column(name = "full_key", length = 255)
    private String fullKey;

    @Column(name = "thumb_key", length = 255)
    private String thumbKey;

    @Column(name = "rendered_at")
    private LocalDateTime renderedAt;

    /** The background copy leaves this photo alone until then, after Open Food Facts refused or failed it. */
    @Column(name = "render_retry_at")
    private LocalDateTime renderRetryAt;

    @Column(name = "contributor_id")
    private UUID contributorId;

    @Column(name = "confirmed_by_id")
    private UUID confirmedById;

    @Builder.Default
    @Column(name = "report_count", nullable = false)
    private int reportCount = 0;

    @Column(name = "flagged_at")
    private LocalDateTime flaggedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Timestamps.nowUtc();
    }

    public boolean isRendered() {
        return fullKey != null && thumbKey != null;
    }

    public boolean hasCrop() {
        return cropX != null && cropY != null && cropWidth != null && cropHeight != null;
    }
}
