package disscount.digitalCard.domain;

import disscount.util.Timestamps;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import disscount.user.domain.User;

@Entity
@Table(name = "digital_card")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DigitalCard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "card_name", nullable = false)
    private String cardName;

    // Plain String, never @Enumerated: ddl-auto=update leaves a stale CHECK constraint
    // behind if the vocabulary ever changes. Values: loyalty | gift | membership | other.
    @Column(name = "card_type", nullable = false, length = 16)
    private String cardType;

    @Column(name = "store_name", nullable = false)
    private String storeName;

    // cijene-api chain code when the user picked an official chain; null for free text.
    @Column(name = "chain_code", length = 40)
    private String chainCode;

    @Column(name = "code_value", nullable = false, length = 4096)
    private String codeValue;

    // Barcode Detection API format name (ean_13, qr_code, ...) or "unknown".
    @Column(name = "code_type", nullable = false, length = 32)
    private String codeType;

    @Column(name = "card_color", nullable = false, length = 7)
    private String cardColor;

    @Column(name = "icon_image", columnDefinition = "TEXT")
    private String iconImage;

    @Column(name = "front_image", columnDefinition = "TEXT")
    private String frontImage;

    @Column(name = "back_image", columnDefinition = "TEXT")
    private String backImage;

    @Column(name = "note", length = 500)
    private String note;

    // Null = not pinned, matching User's toggle timestamps. Pinning goes through
    // @PreUpdate, so it counts as a change and bumps updatedAt.
    @Column(name = "pinned_at")
    private LocalDateTime pinnedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

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
