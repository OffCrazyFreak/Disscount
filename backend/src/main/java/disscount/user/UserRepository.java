package disscount.user;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import disscount.shared.UnauthorizedException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Live profiles only: @SQLRestriction hides deleted ones, and the erasure ledger answers for those. */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    List<User> findAllByOrderByCreatedAtAsc();

    @Query("SELECT u.id FROM User u")
    List<UUID> findActiveIds();

    /** Live names only; deleteAccount nulls the name of a deleted profile, so none is left to collide with. */
    boolean existsByUsername(String username);

    /** Native for the same reason as the ledger backfill; frees names that deletions before deleteAccount nulled kept. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "UPDATE app.app_user SET username = NULL WHERE deleted_at IS NOT NULL AND username IS NOT NULL",
            nativeQuery = true)
    int clearUsernamesOfDeletedProfiles();

    /** Native, so profiles deleted before the ledger existed also count; @SQLRestriction hides them from count(). */
    @Query(value = "SELECT COUNT(*) FROM app.app_user", nativeQuery = true)
    long countIncludingDeleted();

    /** Native, as @SQLRestriction hides the row; only for a profile deleted before the ledger existed. */
    @Query(value = "SELECT COUNT(*) > 0 FROM app.app_user WHERE id = :id AND deleted_at IS NOT NULL", nativeQuery = true)
    boolean isDeletedProfile(UUID id);

    /** Row lock held until the transaction ends; the per-user mutex for card writes. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdForUpdate(UUID id);

    /** Row locks on every live admin, held until the transaction ends; ordered so concurrent callers lock in the same order. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.accountType = disscount.user.AccountType.ADMIN AND u.deletedAt IS NULL ORDER BY u.id")
    List<User> lockActiveAdmins();

    /** For the caller's own id: a token outlives its account, so a missing row means the session is over. */
    default User requireActive(UUID callerId) {
        return findById(callerId)
                .orElseThrow(() -> new UnauthorizedException("error.user.notFound"));
    }

    /** {@link #requireActive} under the account deletion row lock, so a write cannot land after the deletion. */
    default User requireActiveForUpdate(UUID callerId) {
        return findByIdForUpdate(callerId)
                .orElseThrow(() -> new UnauthorizedException("error.user.notFound"));
    }
}
