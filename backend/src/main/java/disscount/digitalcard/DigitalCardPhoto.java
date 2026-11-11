package disscount.digitalcard;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

import disscount.shared.Timestamps;

@Entity
@Table(name = "wallet_card_photo",
        uniqueConstraints = @UniqueConstraint(name = "uq_wallet_card_photo_slot", columnNames = {"card_id", "slot"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DigitalCardPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "card_id", nullable = false)
    private DigitalCard card;

    @Column(nullable = false, length = 8)
    private String slot;

    // A raw char(64) definition reads back from PostgreSQL as bpchar, which ddl-auto=update re-alters at every start.
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(nullable = false, length = 64)
    private String sha256;

    @Column(name = "full_key", nullable = false, length = 255)
    private String fullKey;

    @Column(name = "thumb_key", length = 255)
    private String thumbKey;

    @Column(name = "content_type", nullable = false, length = 32)
    private String contentType;

    @Column(name = "byte_size", nullable = false)
    private int byteSize;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Timestamps.nowUtc();
    }
}
