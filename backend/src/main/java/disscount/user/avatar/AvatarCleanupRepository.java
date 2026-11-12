package disscount.user.avatar;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
interface AvatarCleanupRepository extends JpaRepository<AvatarCleanup, UUID> {

    @Query("SELECT c FROM AvatarCleanup c ORDER BY c.createdAt, c.id")
    List<AvatarCleanup> findOldest(Pageable pageable);

    /** The next page after the last row tried, so rows that keep failing never hide the ones behind them. */
    @Query("""
            SELECT c FROM AvatarCleanup c
            WHERE c.createdAt > :createdAt OR (c.createdAt = :createdAt AND c.id > :id)
            ORDER BY c.createdAt, c.id
            """)
    List<AvatarCleanup> findOldestAfter(LocalDateTime createdAt, UUID id, Pageable pageable);

    // REQUIRES_NEW because an afterCommit callback joining the finished transaction would never commit.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @Modifying
    @Query("DELETE FROM AvatarCleanup c WHERE c.id = :id")
    void removeById(UUID id);
}
