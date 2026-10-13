package disscount.storeName.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import disscount.util.Timestamps;

/** A community store name offered as autocomplete. Deliberately holds no user reference: the list is public. */
@Entity
@Table(name = "store_name_suggestion",
        uniqueConstraints = @UniqueConstraint(name = "uq_store_name_normalized", columnNames = "normalized_name"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreNameSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(name = "normalized_name", nullable = false, length = 60)
    private String normalizedName;

    @Column(name = "use_count", nullable = false)
    private int useCount;

    @Column(nullable = false)
    @Builder.Default
    private boolean hidden = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Timestamps.nowUtc();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Timestamps.nowUtc();
    }
}
