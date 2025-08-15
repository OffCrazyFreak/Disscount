package disccount.notification.dao;

import disccount.notification.domain.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.deletedAt IS NULL ORDER BY n.createdAt DESC")
    Page<Notification> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE n.id = :id AND n.deletedAt IS NULL")
    Optional<Notification> findById(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false AND n.deletedAt IS NULL")
    int markAllAsReadByUserId(@Param("userId") UUID userId);
}
