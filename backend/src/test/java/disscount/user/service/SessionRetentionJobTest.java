package disscount.user.service;

import disscount.user.dao.AuthIdentityDao;
import disscount.util.Timestamps;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** The better-auth tables have no entities, so the test builds the columns the job touches. */
@DataJpaTest(showSql = false)
@Import({SessionRetentionJob.class, AuthIdentityDao.class})
class SessionRetentionJobTest {

    @Autowired SessionRetentionJob job;
    @Autowired EntityManager entityManager;

    @BeforeEach
    void createSessionTable() {
        entityManager.createNativeQuery("""
                CREATE TABLE IF NOT EXISTS "session" (
                    token VARCHAR(64) PRIMARY KEY,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP NOT NULL,
                    ip_address VARCHAR(64),
                    user_agent VARCHAR(255)
                )
                """).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM \"session\"").executeUpdate();
    }

    @Test
    void deletesSessionsExpiredLongerThanTheGraceAndKeepsTheRest() {
        LocalDateTime now = Timestamps.nowUtc();
        insertSession("long-expired", now.minusDays(2), now.minusDays(32));
        insertSession("just-expired", now.minusMinutes(5), now.minusDays(30));
        insertSession("active", now.plusDays(10), now.minusDays(20));

        job.sweep();

        assertThat(tokens()).containsExactlyInAnyOrder("just-expired", "active");
    }

    @Test
    void clearsTheAddressOfAStillActiveSessionADayBeforeItTurnsThirtyDaysOld() {
        LocalDateTime now = Timestamps.nowUtc();
        insertSession("old-but-active", now.plusDays(25), now.minusDays(29).minus(Duration.ofHours(1)));
        insertSession("recent", now.plusDays(25), now.minusDays(29).plus(Duration.ofHours(1)));

        job.sweep();

        assertThat(ipAddress("old-but-active")).isNull();
        assertThat(userAgent("old-but-active")).isEqualTo("Firefox");
        assertThat(ipAddress("recent")).isEqualTo("203.0.113.7");
    }

    private void insertSession(String token, LocalDateTime expiresAt, LocalDateTime createdAt) {
        entityManager.createNativeQuery("""
                        INSERT INTO "session" (token, expires_at, created_at, ip_address, user_agent)
                        VALUES (:token, :expiresAt, :createdAt, '203.0.113.7', 'Firefox')
                        """)
                .setParameter("token", token)
                .setParameter("expiresAt", expiresAt)
                .setParameter("createdAt", createdAt)
                .executeUpdate();
    }

    @SuppressWarnings("unchecked")
    private List<String> tokens() {
        return entityManager.createNativeQuery("SELECT token FROM \"session\"").getResultList();
    }

    private Object ipAddress(String token) {
        return column("ip_address", token);
    }

    private Object userAgent(String token) {
        return column("user_agent", token);
    }

    private Object column(String name, String token) {
        return entityManager.createNativeQuery("SELECT " + name + " FROM \"session\" WHERE token = :token")
                .setParameter("token", token)
                .getSingleResult();
    }
}
