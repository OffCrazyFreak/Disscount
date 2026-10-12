package disscount.digitalCard.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import disscount.digitalCard.domain.DigitalCardPhoto;

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

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM DigitalCardPhoto p WHERE p.card.id = :cardId")
    void deleteAllByCardId(UUID cardId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM DigitalCardPhoto p WHERE p.card.id IN (SELECT c.id FROM DigitalCard c WHERE c.user.id = :userId)")
    void deleteAllByUserId(UUID userId);
}
