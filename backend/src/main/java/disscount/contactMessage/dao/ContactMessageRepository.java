package disscount.contactMessage.dao;

import disscount.contactMessage.domain.ContactMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, UUID> {

    List<ContactMessage> findByDeletedAtIsNullOrderByCreatedAtDesc(Pageable pageable);

    List<ContactMessage> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
