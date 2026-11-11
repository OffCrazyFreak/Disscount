package disscount.user;

import disscount.shared.Timestamps;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/** Ids only, so account erasure keeps it as the record of what an admin did (docs/ADMIN.md, section 8). */
@Entity
@Table(name = "admin_audit")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class AdminAuditEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "actor_user_id", nullable = false, updatable = false)
    private UUID actorUserId;

    @Column(name = "target_user_id", updatable = false)
    private UUID targetUserId;

    // The contact message an inbox action touched; a user action names its user in targetUserId instead.
    @Column(name = "object_id", updatable = false)
    private UUID objectId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, updatable = false, length = 32)
    private AdminAction action;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private LocalDateTime occurredAt;

    AdminAuditEntry(UUID actorUserId, UUID targetUserId, UUID objectId, AdminAction action) {
        this.actorUserId = actorUserId;
        this.targetUserId = targetUserId;
        this.objectId = objectId;
        this.action = action;
        this.occurredAt = Timestamps.nowUtc();
    }
}
