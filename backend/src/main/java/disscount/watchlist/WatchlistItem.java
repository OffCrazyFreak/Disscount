package disscount.watchlist;

import disscount.shared.Timestamps;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@SQLRestriction("deleted_at is null")
@Table(name = "watchlist_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
class WatchlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotBlank(message = "{validation.productApiId.required}")
    @Column(name = "product_api_id", nullable = false)
    private String productApiId;

    @Enumerated(EnumType.STRING)
    @Column(name = "watch_type", nullable = false)
    private WatchType watchType;

    @Column(name = "threshold_value", nullable = false)
    private Double thresholdValue;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Timestamps.nowUtc();
        updatedAt = Timestamps.nowUtc();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Timestamps.nowUtc();
    }
}
