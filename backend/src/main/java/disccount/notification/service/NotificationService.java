package disccount.notification.service;

import disccount.appUser.dao.UserRepository;
import disccount.appUser.domain.User;
import disccount.exceptions.BadRequestException;
import disccount.notification.dao.NotificationRepository;
import disccount.notification.domain.Notification;
import disccount.notification.dto.NotificationDto;
import disccount.notification.dto.NotificationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationDto createNotification(UUID userId, NotificationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        Notification notification = Notification.builder()
                .user(user)
                .message(request.getMessage())
                .relatedProductApiId(request.getRelatedProductApiId())
                .relatedStoreApiId(request.getRelatedStoreApiId())
                .build();

        Notification saved = notificationRepository.save(notification);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> getUserNotifications(UUID userId, Pageable pageable) {
        Page<Notification> notifications = notificationRepository.findByUserId(userId, pageable);
        return notifications.map(this::mapToDto);
    }

    public void markAsRead(UUID id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Notification not found"));

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    public int markAllAsRead(UUID userId) {
        return notificationRepository.markAllAsReadByUserId(userId);
    }

    public void deleteNotification(UUID id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Notification not found"));

        notification.setDeletedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    private NotificationDto mapToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .userId(notification.getUser().getId())
                .message(notification.getMessage())
                .isRead(notification.getIsRead())
                .relatedProductApiId(notification.getRelatedProductApiId())
                .relatedStoreApiId(notification.getRelatedStoreApiId())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
