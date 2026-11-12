package disscount.digitalcard.photo;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface PhotoCleanupRepository extends JpaRepository<PhotoCleanup, UUID> {

    @Query("SELECT p FROM PhotoCleanup p ORDER BY p.createdAt, p.id")
    List<PhotoCleanup> findOldest(Pageable pageable);

    /** The next page after the last row tried, so rows that keep failing never hide the ones behind them. */
    @Query("""
            SELECT p FROM PhotoCleanup p
            WHERE p.createdAt > :createdAt OR (p.createdAt = :createdAt AND p.id > :id)
            ORDER BY p.createdAt, p.id
            """)
    List<PhotoCleanup> findOldestAfter(LocalDateTime createdAt, UUID id, Pageable pageable);

    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM PhotoCleanup p WHERE p.prefix = false AND p.keyOrPrefix IN :keys")
    void removePendingKeys(Collection<String> keys);

    // REQUIRES_NEW because an afterCommit callback joining the finished transaction would never commit.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @Modifying
    @Query("DELETE FROM PhotoCleanup p WHERE p.id = :id")
    void removeById(UUID id);
}
