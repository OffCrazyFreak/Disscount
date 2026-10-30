package disscount.contactMessage.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContactMessageRequest {

    @Email(message = "{validation.email.invalid}")
    @Size(max = 255, message = "{validation.email.tooLong}")
    private String email;

    @Size(max = 255, message = "{validation.name.tooLong}")
    private String fullName;

    @NotBlank(message = "{validation.subject.required}")
    @Size(max = 255, message = "{validation.subject.tooLong}")
    private String subject;

    @NotBlank(message = "{validation.contactMessage.required}")
    @Size(max = 5000, message = "{validation.contactMessage.tooLong}")
    private String message;

    @Size(max = 255, message = "{validation.sourcePath.tooLong}")
    private String sourcePath;

    // Honeypot: must stay empty; bots fill it. Filled submissions are silently dropped.
    private String honeypot;
}
