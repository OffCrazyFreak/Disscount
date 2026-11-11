package disscount.user;

import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.UUID;

/** Insert and read only, as the audit is append only. */
interface AdminAuditRepository extends Repository<AdminAuditEntry, UUID> {

    AdminAuditEntry save(AdminAuditEntry entry);

    List<AdminAuditEntry> findByTargetUserIdOrderByOccurredAtAsc(UUID targetUserId);
}
