package disscount.digitalCard.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import disscount.util.Timestamps;

/** A pending object storage delete, written in the same transaction as the row delete it belongs to. */
@Entity
@Table(name = "photo_cleanup")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhotoCleanup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "key_or_prefix", nullable = false, length = 512)
    private String keyOrPrefix;

    @Column(name = "is_prefix", nullable = false)
    private boolean prefix;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Timestamps.nowUtc();
    }
}
