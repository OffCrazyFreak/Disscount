package disscount.user.dao;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import disscount.exceptions.UnauthorizedException;
import disscount.user.domain.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    List<User> findByDeletedAtIsNullOrderByCreatedAtAsc();

    Optional<User> findByIdAndDeletedAtIsNull(UUID id);

    @Query("SELECT u.id FROM User u WHERE u.deletedAt IS NULL")
    List<UUID> findActiveIds();

    /** Spans soft-deleted rows too, matching the unique index; deleteAccount nulls the username, which frees the name. */
    boolean existsByUsername(String username);

    /** Row lock held until the transaction ends; the per-user mutex for card writes. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdForUpdate(UUID id);

    /** For the caller's own id: a token outlives its account, so a missing row means the session is over. */
    default User requireActive(UUID callerId) {
        return findByIdAndDeletedAtIsNull(callerId)
                .orElseThrow(() -> new UnauthorizedException("error.user.notFound"));
    }

    /** {@link #requireActive} under the account deletion row lock, so a write cannot land after the deletion. */
    default User requireActiveForUpdate(UUID callerId) {
        return findByIdForUpdate(callerId)
                .filter(user -> user.getDeletedAt() == null)
                .orElseThrow(() -> new UnauthorizedException("error.user.notFound"));
    }
}
