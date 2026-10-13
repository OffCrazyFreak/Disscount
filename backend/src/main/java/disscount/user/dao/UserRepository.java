package disscount.user.dao;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import disscount.user.domain.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    List<User> findByDeletedAtIsNullOrderByCreatedAtAsc();

    /**
     * Spans soft-deleted rows too, matching the unique index, which does not care that an
     * account is gone. In practice they never collide: deleteAccount nulls the username,
     * which is what frees the name for somebody else.
     */
    boolean existsByUsername(String username);

    /** Row lock held until the transaction ends; the per-user mutex for card writes. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdForUpdate(UUID id);
}
