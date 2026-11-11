package disscount.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
interface ErasureLedgerRepository extends JpaRepository<ErasureLedgerEntry, UUID> {

    /** Native, as @SQLRestriction hides deleted profiles from JPQL; for profiles deleted before the ledger existed. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            INSERT INTO app.erasure_ledger (user_id, erased_at, scope)
            SELECT u.id, u.deleted_at, 'account' FROM app.app_user u
            WHERE u.deleted_at IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM app.erasure_ledger l WHERE l.user_id = u.id)
            """, nativeQuery = true)
    int tombstoneDeletedProfiles();
}
