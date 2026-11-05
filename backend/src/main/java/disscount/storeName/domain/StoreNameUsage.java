package disscount.storeName.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import disscount.util.Timestamps;

/** Which user counted toward a suggestion, so one person is one use. Never exposed through the API. */
@Entity
@Table(name = "store_name_usage",
        uniqueConstraints = @UniqueConstraint(name = "uq_store_name_usage_user_suggestion",
                columnNames = {"user_id", "suggestion_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreNameUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "suggestion_id", nullable = false)
    private StoreNameSuggestion suggestion;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Timestamps.nowUtc();
    }
}
