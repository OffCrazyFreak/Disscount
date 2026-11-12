package disscount.contact;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, UUID> {

    // The id breaks ties between messages sent in the same instant, so the order never changes between loads.
    List<ContactMessage> findAllByOrderByCreatedAtDescIdDesc();

    // Native from here on: the admin sees, reads and restores deleted messages, which @SQLRestriction hides from JPQL.

    @Query(value = "SELECT * FROM app.contact_message ORDER BY created_at DESC, id DESC", nativeQuery = true)
    List<ContactMessage> findIncludingDeletedNewestFirst();

    @Query(value = "SELECT * FROM app.contact_message WHERE id = :id", nativeQuery = true)
    Optional<ContactMessage> findIncludingDeletedById(UUID id);

    /** Messages sent signed in, and those sent signed out from the login address; a null address matches none. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            UPDATE app.contact_message SET email = NULL, full_name = NULL
            WHERE (user_id = :senderId OR (user_id IS NULL AND lower(email) = lower(CAST(:loginEmail AS VARCHAR))))
              AND (email IS NOT NULL OR full_name IS NOT NULL)
            """, nativeQuery = true)
    int blankSender(UUID senderId, String loginEmail);
}
