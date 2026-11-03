package disscount.user.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Tombstone of an erased account: the only record kept once its data is gone. Holds no personal
 * data. Nothing reads it yet; it is the record a backup restore or a stale token check can use.
 */
@Entity
@Table(name = "erasure_ledger")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ErasureLedgerEntry {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "erased_at", nullable = false, updatable = false)
    private LocalDateTime erasedAt;
}
