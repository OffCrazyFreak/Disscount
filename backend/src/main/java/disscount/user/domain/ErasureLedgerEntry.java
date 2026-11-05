package disscount.user.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;
import java.util.UUID;

/** No personal data; the 410 check reads it, and the backup sidecar makes markers for restores (docs/BACKUPS.md). */
@Entity
@Table(name = "erasure_ledger")
@Getter
@NoArgsConstructor
public class ErasureLedgerEntry {

    public static final String ACCOUNT = "account";

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "erased_at", nullable = false, updatable = false)
    private LocalDateTime erasedAt;

    // What was erased; part of each marker's keyed hash, so a later kind of erasure never collides with an account.
    @ColumnDefault("'account'")
    @Column(name = "scope", nullable = false, updatable = false, length = 32)
    private String scope;

    public ErasureLedgerEntry(UUID userId, LocalDateTime erasedAt) {
        this.userId = userId;
        this.erasedAt = erasedAt;
        this.scope = ACCOUNT;
    }
}
