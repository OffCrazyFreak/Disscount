package disscount.contactMessage.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ContactMessageDto {

    private UUID id;
    private UUID userId;
    private String email;
    private String fullName;
    private String subject;
    private String message;
    private String sourcePath;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
