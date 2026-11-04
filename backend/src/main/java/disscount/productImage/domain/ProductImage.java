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
        indexes = {@Index(name = "idx_product_image_ean", columnList = "ean"),
                @Index(name = "idx_product_image_sha256", columnList = "content_sha256")},
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

    @Convert(converter = HiddenReason.Column.class)
    @Column(name = "hidden_reason", length = 12)
    private HiddenReason hiddenReason;

    /** Open Food Facts image name: "front_hr" for a selected front, "raw:100" for an uploaded photo. */
    @Column(name = "external_key", length = 32)
    private String externalKey;

    /** Revision of a selected Open Food Facts image, part of its file name. */
    @Column(name = "external_rev", length = 16)
    private String externalRev;

    @Column(length = 8)
    private String lang;

    /** Sanitized upload in the private photo folder; Open Food Facts photos are fetched again instead. */
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

    /** The 160 pixel list file; null on photos rendered before it existed, which lists then show at thumb size. */
    @Column(name = "small_key", length = 255)
    private String smallKey;

    @Column(name = "rendered_at")
    private LocalDateTime renderedAt;

    /** The background copy leaves this photo alone until then, after Open Food Facts refused or failed it. */
    @Column(name = "render_retry_at")
    private LocalDateTime renderRetryAt;

    /** Copies that failed with a refusal or server error; the job gives up on the photo at a cap. */
    @Column(name = "render_attempts")
    private Integer renderAttempts;

    @Column(name = "contributor_id")
    private UUID contributorId;

    @Column(name = "confirmed_by_id")
    private UUID confirmedById;

    @Builder.Default
    @Column(name = "report_count", nullable = false)
    private int reportCount = 0;

    @Column(name = "flagged_at")
    private LocalDateTime flaggedAt;

    /** SHA-256 of the uploaded file, or of the stored original for photos uploaded before this column; blocks re-uploads of a deleted photo. */
    @Column(name = "content_sha256", length = 64)
    private String contentSha256;

    /** Set when an admin deleted the files; the row stays as a tombstone so neither an upload nor the import brings the photo back. */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by_id")
    private UUID deletedById;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Timestamps.nowUtc();
    }

    public boolean isRendered() {
        return fullKey != null && thumbKey != null;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public boolean hasCrop() {
        return cropX != null && cropY != null && cropWidth != null && cropHeight != null;
    }
}
