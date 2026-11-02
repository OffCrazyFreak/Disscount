package disscount.notification.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import disscount.notification.dto.NotificationDto;
import disscount.notification.service.NotificationService;
import disscount.util.SecurityUtils;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "User notification management endpoints")
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "Get current user's notifications with pagination")
    @GetMapping("/me")
    public ResponseEntity<Page<NotificationDto>> getCurrentUserNotifications(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        UUID userId = SecurityUtils.getCurrentUserId();
        Page<NotificationDto> notifications = notificationService.getUserNotifications(userId, pageable);
        return ResponseEntity.ok(notifications);
    }

    @Operation(summary = "Mark notification as read")
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id, SecurityUtils.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Mark all user's notifications as read")
    @PatchMapping("/me/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        UUID userId = SecurityUtils.getCurrentUserId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Delete notification")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable UUID id) {
        notificationService.deleteNotification(id, SecurityUtils.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }
}
