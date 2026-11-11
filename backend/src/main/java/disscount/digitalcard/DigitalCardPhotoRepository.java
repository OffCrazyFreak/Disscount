package disscount.digitalcard;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DigitalCardPhotoRepository extends JpaRepository<DigitalCardPhoto, UUID> {

    @Query("SELECT p FROM DigitalCardPhoto p WHERE p.card.id = :cardId")
    List<DigitalCardPhoto> findByCardId(UUID cardId);

    @Query("SELECT p FROM DigitalCardPhoto p WHERE p.card.id IN :cardIds")
    List<DigitalCardPhoto> findByCardIdIn(Collection<UUID> cardIds);

    @Query("SELECT p FROM DigitalCardPhoto p WHERE p.card.id = :cardId AND p.slot = :slot")
    Optional<DigitalCardPhoto> findByCardIdAndSlot(UUID cardId, String slot);

    @Query("SELECT COUNT(p) > 0 FROM DigitalCardPhoto p WHERE p.fullKey = :key OR p.thumbKey = :key")
    boolean isKeyReferenced(String key);

    @Query("SELECT COUNT(p) > 0 FROM DigitalCardPhoto p WHERE p.fullKey LIKE CONCAT(:prefix, '%')")
    boolean anyKeyStartsWith(String prefix);

    // Native from here on: JPQL through p.card skips the photos of a deleted card, which the purge must still delete.

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM wallet_card_photo WHERE card_id = :cardId", nativeQuery = true)
    void deleteAllByCardId(UUID cardId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM wallet_card_photo WHERE card_id IN (SELECT id FROM wallet_card WHERE user_id = :userId)",
            nativeQuery = true)
    void deleteAllByUserId(UUID userId);
}
