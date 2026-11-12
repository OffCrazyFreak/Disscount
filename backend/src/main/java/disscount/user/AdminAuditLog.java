package disscount.user;

import disscount.shared.Timestamps;
import disscount.user.admin.AdminAuditEntry;
import disscount.user.admin.AdminAuditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Writes app.admin_audit inside the caller's transaction, so an admin action without its row cannot commit
 * (docs/ADMIN.md, section 8). Other features record their admin actions here.
 */
@Component
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class AdminAuditLog {

    // A dashboard refetches its lists on focus and on every change; one row per window says who looked, and when.
    static final Duration READ_DEDUP_WINDOW = Duration.ofMinutes(10);

    private final AdminAuditRepository entries;

    void recordUserAction(UUID adminUserId, UUID targetUserId, AdminAction action) {
        entries.save(new AdminAuditEntry(adminUserId, targetUserId, null, action));
    }

    /** A change to a contact message, recorded every time. */
    public void recordContactChange(UUID adminUserId, UUID messageId, AdminAction action) {
        entries.save(new AdminAuditEntry(adminUserId, null, messageId, action));
    }

    /** A read of a list (objectId null) or of one message, at most once per admin, action and object per window. */
    public void recordRead(UUID adminUserId, AdminAction action, UUID objectId) {
        LocalDateTime windowStart = Timestamps.nowUtc().minus(READ_DEDUP_WINDOW);

        boolean alreadyRecorded = objectId == null
                ? entries.existsByActorUserIdAndActionAndObjectIdIsNullAndOccurredAtAfter(adminUserId, action, windowStart)
                : entries.existsByActorUserIdAndActionAndObjectIdAndOccurredAtAfter(adminUserId, action, objectId, windowStart);

        if (!alreadyRecorded) {
            entries.save(new AdminAuditEntry(adminUserId, null, objectId, action));
        }
    }
}
