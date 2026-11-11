package disscount.user;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Applies the audit retention of the privacy policy through database functions, because the backend login holds
 * no UPDATE or DELETE on either audit table (docs/ADMIN.md, section 8; docs/AUTH.md, 8.6).
 */
@Component
@RequiredArgsConstructor
class AuditRetentionJob {

    private static final Logger log = LoggerFactory.getLogger(AuditRetentionJob.class);

    private final JdbcTemplate jdbc;

    // Hourly like the session sweep, so an address turns 29 days old at most an hour before it is cleared.
    @Scheduled(cron = "0 47 * * * *", zone = "UTC")
    public void sweep() {
        purgeAdminAudit();
        purgeSecurityEvents();
    }

    private void purgeAdminAudit() {
        try {
            Integer deleted = jdbc.queryForObject("SELECT app.purge_admin_audit()", Integer.class);
            log.info("Deleted {} admin audit rows older than 12 months", deleted);
        } catch (DataAccessException e) {
            log.error("Purging the admin audit failed", e);
        }
    }

    // Its own try, so a web migration that has not run yet never holds back the admin purge.
    private void purgeSecurityEvents() {
        try {
            Map<String, Object> counts = jdbc.queryForMap("SELECT scrubbed, deleted FROM web.purge_security_events()");
            log.info("Cleared the address on {} security events, deleted {} expired ones",
                    counts.get("scrubbed"), counts.get("deleted"));
        } catch (DataAccessException e) {
            log.error("Purging the security events failed", e);
        }
    }
}
