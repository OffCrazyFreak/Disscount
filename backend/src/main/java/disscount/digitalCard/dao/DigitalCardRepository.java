package disscount.digitalCard.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import disscount.digitalCard.domain.DigitalCard;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DigitalCardRepository extends JpaRepository<DigitalCard, UUID> {

    @Query("SELECT c FROM DigitalCard c WHERE c.user.id = :userId AND c.deletedAt IS NULL")
    List<DigitalCard> findActiveByUserId(UUID userId);

    // Ownership lives in the query, so a card of another user is indistinguishable from a missing one.
    @Query("SELECT c FROM DigitalCard c WHERE c.id = :id AND c.user.id = :userId AND c.deletedAt IS NULL")
    Optional<DigitalCard> findActiveByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT COUNT(c) FROM DigitalCard c WHERE c.user.id = :userId AND c.deletedAt IS NULL")
    long countActiveByUserId(UUID userId);

    // A bulk update on purpose: it skips @PreUpdate, so using a card never bumps updated_at.
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE DigitalCard c SET c.lastUsedAt = :usedAt WHERE c.id = :id AND c.user.id = :userId "
            + "AND c.deletedAt IS NULL AND (c.lastUsedAt IS NULL OR c.lastUsedAt < :usedAt)")
    int touchLastUsed(UUID id, UUID userId, LocalDateTime usedAt);

    @Query("SELECT c FROM DigitalCard c WHERE c.deletedAt IS NOT NULL AND c.deletedAt < :cutoff")
    List<DigitalCard> findDeletedBefore(LocalDateTime cutoff);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM DigitalCard c WHERE c.user.id = :userId")
    void deleteAllByUserId(UUID userId);
}
