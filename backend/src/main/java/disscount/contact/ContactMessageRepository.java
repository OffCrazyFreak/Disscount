package disscount.contact;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, UUID> {

    List<ContactMessage> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // Native from here on: the admin sees, reads and restores deleted messages, which @SQLRestriction hides from JPQL.

    @Query(value = "SELECT * FROM app.contact_message ORDER BY created_at DESC LIMIT :limit", nativeQuery = true)
    List<ContactMessage> findIncludingDeletedNewestFirst(int limit);

    @Query(value = "SELECT * FROM app.contact_message WHERE id = :id", nativeQuery = true)
    Optional<ContactMessage> findIncludingDeletedById(UUID id);
}
