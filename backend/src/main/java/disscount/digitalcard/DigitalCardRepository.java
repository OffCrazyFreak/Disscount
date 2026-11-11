package disscount.digitalcard;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DigitalCardRepository extends JpaRepository<DigitalCard, UUID> {

    @Query("SELECT c FROM DigitalCard c WHERE c.userId = :userId")
    List<DigitalCard> findActiveByUserId(UUID userId);

    // Ownership lives in the query, so a card of another user is indistinguishable from a missing one.
    @Query("SELECT c FROM DigitalCard c WHERE c.id = :id AND c.userId = :userId")
    Optional<DigitalCard> findActiveByIdAndUserId(UUID id, UUID userId);

    boolean existsByIdAndUserId(UUID id, UUID userId);

    boolean existsByIdAndUserIdNot(UUID id, UUID userId);

    @Query("SELECT COUNT(c) FROM DigitalCard c WHERE c.userId = :userId")
    long countActiveByUserId(UUID userId);

    // A bulk update on purpose: it skips @PreUpdate, so using a card never bumps updated_at.
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE DigitalCard c SET c.lastUsedAt = :usedAt WHERE c.id = :id AND c.userId = :userId "
            + "AND (c.lastUsedAt IS NULL OR c.lastUsedAt < :usedAt)")
    int touchLastUsed(UUID id, UUID userId, LocalDateTime usedAt);

    // Bulk updates for the same reason: pinning or archiving is not an edit, so updated_at stays.
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE DigitalCard c SET c.pinnedAt = :pinnedAt WHERE c.id = :id AND c.userId = :userId")
    int updatePinnedAt(UUID id, UUID userId, LocalDateTime pinnedAt);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE DigitalCard c SET c.archivedAt = :archivedAt WHERE c.id = :id AND c.userId = :userId")
    int updateArchivedAt(UUID id, UUID userId, LocalDateTime archivedAt);

    // Native from here on: @SQLRestriction hides deleted cards from JPQL reads, updates and deletes alike.

    /** Deleted cards keep their id, so a replayed create of a deleted card can answer 404 instead of reviving it. */
    @Query(value = "SELECT COUNT(*) > 0 FROM wallet_card WHERE id = :id AND deleted_at IS NOT NULL", nativeQuery = true)
    boolean isDeleted(UUID id);

    @Query(value = "SELECT * FROM wallet_card WHERE deleted_at < :cutoff", nativeQuery = true)
    List<DigitalCard> findDeletedBefore(LocalDateTime cutoff);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM wallet_card WHERE id IN (:ids)", nativeQuery = true)
    void purgeByIds(Collection<UUID> ids);

    /** Deleted cards included, as their card numbers must not outlive the account either. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM wallet_card WHERE user_id = :userId", nativeQuery = true)
    void deleteAllByUserId(UUID userId);
}
