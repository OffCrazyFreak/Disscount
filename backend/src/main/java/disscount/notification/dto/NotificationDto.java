package disscount.notification.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationDto {

    private UUID id;
    private UUID userId;
    private String message;
    private Boolean isRead;
    private String relatedProductApiId;
    private String relatedStoreApiId;
    private LocalDateTime createdAt;
}
