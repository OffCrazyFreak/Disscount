package disscount.user;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/** A restore has no browser to finish a deletion, so only the replay deletes logins from Spring (docs/AUTH.md 7.4). */
@Repository
@Profile(ErasureReplayRunner.PROFILE)
class ReplayIdentityDeletion {

    @PersistenceContext
    private EntityManager entityManager;

    /** Cascades the identity's sessions and accounts. */
    @Transactional
    public void deleteById(UUID userId) {
        entityManager.createNativeQuery("DELETE FROM auth.\"user\" WHERE id = :id")
                .setParameter("id", userId)
                .executeUpdate();
    }
}
