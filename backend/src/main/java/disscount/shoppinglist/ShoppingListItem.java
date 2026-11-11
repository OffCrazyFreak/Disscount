package disscount.shoppinglist;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.UUID;

import disscount.shared.Timestamps;

import java.math.BigDecimal;

@Entity
@SQLRestriction("deleted_at is null")
@Table(name = "shopping_list_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
class ShoppingListItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shopping_list_id", nullable = false)
    private ShoppingList shoppingList;

    // Null for a plain item typed by the user that no store in the catalog sells.
    @Column(name = "ean")
    private String ean;

    @Column(name = "brand")
    private String brand;

    @NotBlank(message = "{validation.productName.required}")
    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "quantity")
    private String quantity;

    @Column(name = "unit")
    private String unit;

    @Column(nullable = false)
    @Builder.Default
    private Integer amount = 1;

    @Column(name = "is_checked", nullable = false)
    @Builder.Default
    private Boolean isChecked = false;

    @Column(name = "chain_code")
    private String chainCode;

    @Column(name = "avg_price", precision = 10, scale = 4)  // Allows up to 4 decimal places
    private BigDecimal avgPrice;

    @Column(name = "store_price", precision = 10, scale = 4)
    private BigDecimal storePrice;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "updated_by_user_id")
    private UUID updatedByUserId;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

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
