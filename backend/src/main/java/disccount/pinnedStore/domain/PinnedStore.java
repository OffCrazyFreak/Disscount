package disccount.pinnedStore.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import disccount.appUser.domain.User;

@Entity
@Table(name = "pinned_store", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "store_api_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PinnedStore {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Store API ID is required")
    @Column(name = "store_api_id", nullable = false)
    private String storeApiId;

    @NotBlank(message = "Store name is required")
    @Column(name = "store_name", nullable = false)
    private String storeName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
