package disscount.user.admin;

import org.springframework.data.repository.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import disscount.user.AdminAction;

/** Insert and read only, as the audit is append only; expired rows go through app.purge_admin_audit(). */
public interface AdminAuditRepository extends Repository<AdminAuditEntry, UUID> {

    AdminAuditEntry save(AdminAuditEntry entry);

    List<AdminAuditEntry> findByTargetUserIdOrderByOccurredAtAsc(UUID targetUserId);

    List<AdminAuditEntry> findByActorUserIdOrderByOccurredAtAsc(UUID actorUserId);

    boolean existsByActorUserIdAndActionAndObjectIdIsNullAndOccurredAtAfter(
            UUID actorUserId, AdminAction action, LocalDateTime after);

    boolean existsByActorUserIdAndActionAndObjectIdAndOccurredAtAfter(
            UUID actorUserId, AdminAction action, UUID objectId, LocalDateTime after);
}
