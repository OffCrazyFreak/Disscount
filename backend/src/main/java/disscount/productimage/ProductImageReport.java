package disscount.productimage;

import java.time.LocalDateTime;
import java.util.UUID;

import disscount.shared.Timestamps;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "product_image_report",
        uniqueConstraints = @UniqueConstraint(name = "uq_product_image_report_user",
                columnNames = {"image_id", "user_id"}))
@Getter
@Setter
@NoArgsConstructor
public class ProductImageReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "image_id", nullable = false)
    private UUID imageId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public ProductImageReport(UUID imageId, UUID userId) {
        this.imageId = imageId;
        this.userId = userId;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = Timestamps.nowUtc();
    }
}
