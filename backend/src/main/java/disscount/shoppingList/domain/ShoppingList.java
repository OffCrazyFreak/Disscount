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
import disscount.util.Timestamps;

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
    //
    // This is the whole of sharing: the list's own id is the shareable URL, and this says
    // what holding that URL grants. There is no separate token, so turning sharing off and
    // on again hands back the same URL, which is the Google Docs behaviour and is intended.
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
