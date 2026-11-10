package disscount.contact;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ContactMessageDto {

    private UUID id;
    @Schema(nullable = true)
    private UUID userId;
    @Schema(nullable = true)
    private String email;
    @Schema(nullable = true)
    private String fullName;
    private String subject;
    private String message;
    @Schema(nullable = true)
    private String sourcePath;
    @Schema(nullable = true)
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @Schema(nullable = true)
    private LocalDateTime deletedAt;
}
