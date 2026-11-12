package disscount.user.admin;

import disscount.support.FullStackTest;
import disscount.support.MigratedPostgres;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * As the backend login, which can only insert into the audit, so the purge works through the definer function.
 * This database has no drizzle tables, as on a deploy whose web migrations have not run yet.
 */
@MigratedPostgres
class AuditRetentionJobTest extends FullStackTest {

    @Autowired AuditRetentionJob job;
    @Autowired JdbcTemplate jdbc;

    private UUID auditRowAged(String age) {
        UUID actor = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO app.admin_audit (id, actor_user_id, target_user_id, action, occurred_at)
                VALUES (gen_random_uuid(), ?, gen_random_uuid(), 'DELETE_USER', (now() AT TIME ZONE 'UTC') - ?::interval)
                """, actor, age);
        return actor;
    }

    private boolean exists(UUID actor) {
        return jdbc.queryForObject("SELECT count(*) FROM app.admin_audit WHERE actor_user_id = ?", Long.class, actor) == 1;
    }

    @Test
    void deletesAdminRowsOlderThanTwelveMonthsEvenWithoutTheWebFunction() {
        UUID expired = auditRowAged("12 months 1 day");
        UUID kept = auditRowAged("11 months 29 days");

        job.sweep();

        assertThat(exists(expired)).isFalse();
        assertThat(exists(kept)).isTrue();
    }
}
