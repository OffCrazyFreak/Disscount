package disscount.digitalCard.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import disscount.user.domain.User;
import disscount.util.Timestamps;

/**
 * Table is {@code wallet_card}, not the old {@code digital_card}: ddl-auto=update never drops,
 * so reusing the name would merge the new shape into the stale table. The old one is dropped by hand.
 */
@Entity
@Table(name = "wallet_card", indexes = @Index(name = "idx_wallet_card_user", columnList = "user_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DigitalCard {

    // Client generated, so an offline create and its later edits replay in order with no temp ids.
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "card_name", nullable = false, length = 60)
    private String cardName;

    @Column(name = "card_type", nullable = false, length = 16)
    private String cardType;

    @Column(name = "store_name", nullable = false, length = 60)
    private String storeName;

    @Column(name = "chain_code", length = 40)
    private String chainCode;

    @Column(name = "code_value", nullable = false, length = 4096)
    private String codeValue;

    @Column(name = "barcode_value", length = 4096)
    private String barcodeValue;

    @Column(name = "code_type", nullable = false, length = 32)
    private String codeType;

    @Column(name = "card_color", nullable = false, length = 7)
    private String cardColor;

    @Column(length = 500)
    private String note;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "expires_on")
    private LocalDate expiresOn;

    @Column(precision = 19, scale = 4)
    private BigDecimal balance;

    @Column(name = "balance_unit", length = 8)
    private String balanceUnit;

    @Column(name = "pinned_at")
    private LocalDateTime pinnedAt;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

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
