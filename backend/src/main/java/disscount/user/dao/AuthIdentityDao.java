package disscount.user.dao;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import disscount.user.dto.AuthIdentity;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Native queries as no entity maps these better-auth tables, which are never mirrored into app_user. */
@Repository
@Slf4j
public class AuthIdentityDao {

    @PersistenceContext
    private EntityManager entityManager;

    // last_login_at outlives deleted sessions; GREATEST skips NULLs, covering unstamped users and a failed stamp.
    @SuppressWarnings("unchecked")
    public Map<UUID, AuthIdentity> findByUserIds(List<UUID> ids) {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        SELECT u.id, u.email, GREATEST(u.last_login_at, MAX(s.created_at)), MAX(s.updated_at)
                        FROM "user" u
                        LEFT JOIN "session" s ON s.user_id = u.id
                        WHERE u.id IN (:ids)
                        GROUP BY u.id, u.email, u.last_login_at
                        """)
                .setParameter("ids", ids)
                .getResultList();

        Map<UUID, AuthIdentity> identitiesById = new HashMap<>();
        for (Object[] row : rows) {
            identitiesById.put(
                    (UUID) row[0],
                    new AuthIdentity((String) row[1], toInstant(row[2]), toInstant(row[3]))
            );
        }
        return identitiesById;
    }

    @SuppressWarnings("unchecked")
    public List<UUID> findAllIds() {
        return entityManager.createNativeQuery("SELECT id FROM \"user\"").getResultList();
    }

    /** Removes the identity, which cascades its sessions and accounts. */
    @Transactional
    public void deleteById(UUID userId) {
        entityManager.createNativeQuery("DELETE FROM \"user\" WHERE id = :id")
                .setParameter("id", userId)
                .executeUpdate();
    }

    @Transactional
    public int deleteSessionsExpiredBefore(LocalDateTime cutoff) {
        return entityManager.createNativeQuery("DELETE FROM \"session\" WHERE expires_at < :cutoff")
                .setParameter("cutoff", cutoff)
                .executeUpdate();
    }

    // better-auth writes the address once at sign-in, so a sliding session would otherwise keep it for good.
    @Transactional
    public int clearSessionIpAddressesCreatedBefore(LocalDateTime cutoff) {
        return entityManager.createNativeQuery("""
                        UPDATE "session" SET ip_address = NULL
                        WHERE created_at < :cutoff AND ip_address IS NOT NULL
                        """)
                .setParameter("cutoff", cutoff)
                .executeUpdate();
    }

    // Native aggregates differ per driver; an unmapped type is logged, as a silent null blanks the column for everyone.
    private Instant toInstant(Object value) {
        if (value == null) return null;
        // toLocalDateTime() first: the driver reads a zone-less Timestamp in the JVM zone, so toInstant() shifts it.
        if (value instanceof Timestamp timestamp) return timestamp.toLocalDateTime().toInstant(ZoneOffset.UTC);
        if (value instanceof Instant instant) return instant;
        if (value instanceof OffsetDateTime offsetDateTime) return offsetDateTime.toInstant();
        if (value instanceof LocalDateTime localDateTime) return localDateTime.toInstant(ZoneOffset.UTC);

        log.warn("Unmapped session timestamp type {}, treating as null", value.getClass().getName());
        return null;
    }
}
