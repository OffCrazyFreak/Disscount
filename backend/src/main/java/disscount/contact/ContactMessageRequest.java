package disscount.contact;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

record ContactMessageRequest(
        @Email(message = "{validation.email.invalid}")
        @Size(max = 255, message = "{validation.email.tooLong}")
        @Schema(nullable = true)
        String email,

        @Size(max = 255, message = "{validation.name.tooLong}")
        @Schema(nullable = true)
        String fullName,

        @NotBlank(message = "{validation.subject.required}")
        @Size(max = 255, message = "{validation.subject.tooLong}")
        String subject,

        @NotBlank(message = "{validation.contactMessage.required}")
        @Size(max = 5000, message = "{validation.contactMessage.tooLong}")
        String message,

        @Size(max = 255, message = "{validation.sourcePath.tooLong}")
        @Schema(nullable = true)
        String sourcePath,

        // Honeypot: must stay empty; bots fill it. Filled submissions are silently dropped.
        @Size(max = 255, message = "{validation.honeypot.tooLong}")
        @Schema(nullable = true)
        String honeypot) {
}
