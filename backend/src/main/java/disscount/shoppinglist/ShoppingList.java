package disscount.shoppinglist;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import disscount.shared.Timestamps;

@Entity
@Table(name = "shopping_list")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShoppingList {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @NotBlank(message = "{validation.title.required}")
    @Column(nullable = false)
    private String title;

    // Nullable as ddl-auto=update cannot add NOT NULL to a full table; read through resolvedLinkAccess().
    @Enumerated(EnumType.STRING)
    @Column(name = "link_access", length = 16)
    private ListAccess linkAccess;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "shoppingList", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ShoppingListItem> items = new ArrayList<>();

    /** Null link access means the list is not shared at all. */
    public ListAccess resolvedLinkAccess() {
        return linkAccess != null ? linkAccess : ListAccess.NONE;
    }

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
