package disscount.contact;

import disscount.shared.AlphabeticalJson;

import java.time.LocalDateTime;
import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@AlphabeticalJson
@Builder
record ContactMessageDto(
        UUID id,
        @Schema(nullable = true) UUID userId,
        @Schema(nullable = true) String email,
        @Schema(nullable = true) String fullName,
        String subject,
        String message,
        @Schema(nullable = true) String sourcePath,
        @Schema(nullable = true) LocalDateTime readAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        @Schema(nullable = true) LocalDateTime deletedAt) {

    static ContactMessageDto from(ContactMessage message) {
        return ContactMessageDto.builder()
                .id(message.getId())
                .userId(message.getSenderId())
                .email(message.getEmail())
                .fullName(message.getFullName())
                .subject(message.getSubject())
                .message(message.getMessage())
                .sourcePath(message.getSourcePath())
                .readAt(message.getReadAt())
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt())
                .deletedAt(message.getDeletedAt())
                .build();
    }
}
