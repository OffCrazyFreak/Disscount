package disscount.storeName.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import disscount.util.Timestamps;

/**
 * Community store-name vocabulary, offered to everyone in the card form's autocomplete.
 * Deliberately carries no user reference of any kind: suggestions are public, so
 * attribution must not be recoverable from this table.
 */
@Entity
@Table(name = "store_name_suggestion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreNameSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // The display form as first submitted, trimmed and whitespace-collapsed.
    @Column(name = "name", nullable = false, length = 60)
    private String name;

    // Dedupe key: lowercased, diacritics stripped. See StoreNameNormalizer.
    @Column(name = "normalized_name", nullable = false, unique = true, length = 60)
    private String normalizedName;

    // Submission count, not a live card count: monotonic, never decremented on delete.
    // Used only to order the suggestion list.
    @Column(name = "usage_count", nullable = false)
    @Builder.Default
    private Integer usageCount = 0;

    // Moderation hide, reversible. Not deletedAt: the row must survive so its
    // normalized_name slot stays taken and the next card save does not recreate it.
    // TODO(store-name-moderation): rename and merge add a nullable merged_into_id UUID
    // plus admin PATCH endpoints guarded by userService.requireAdmin() inside the service.
    @Column(name = "hidden_at")
    private LocalDateTime hiddenAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = Timestamps.nowUtc();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Timestamps.nowUtc();
    }
}
