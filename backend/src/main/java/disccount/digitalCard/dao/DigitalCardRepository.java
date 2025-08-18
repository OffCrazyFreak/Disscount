package disccount.digitalCard.dao;

import disccount.digitalCard.domain.DigitalCard;
import disccount.user.domain.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DigitalCardRepository extends JpaRepository<DigitalCard, UUID> {

    @Query("SELECT dc FROM DigitalCard dc WHERE dc.user = :user AND dc.deletedAt IS NULL")
    List<DigitalCard> findActiveByUser(User user);

    @Query("SELECT dc FROM DigitalCard dc WHERE dc.id = :id AND dc.deletedAt IS NULL")
    Optional<DigitalCard> findActiveById(UUID id);

    @Query("SELECT dc FROM DigitalCard dc WHERE dc.id = :id AND dc.user = :user AND dc.deletedAt IS NULL")
    Optional<DigitalCard> findActiveByIdAndUser(UUID id, User user);
}
