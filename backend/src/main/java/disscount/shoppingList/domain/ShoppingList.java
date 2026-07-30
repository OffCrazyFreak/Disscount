package disscount.shoppingList.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import disscount.shoppingListItem.domain.ShoppingListItem;
import disscount.user.domain.User;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @NotBlank(message = "Title is required")
    @Column(nullable = false)
    private String title;

    // Nullable because ddl-auto=update cannot add a NOT NULL column to a populated table.
    // Read it through resolvedLinkAccess(), never directly.
    @Enumerated(EnumType.STRING)
    @Column(name = "link_access", length = 16)
    private ListAccess linkAccess;

    // Deliberately not the list id: a token can be rotated, so turning sharing off and on
    // again actually revokes instead of handing the same URL back to everyone who kept it.
    @Column(name = "share_token", unique = true)
    private UUID shareToken;

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
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
