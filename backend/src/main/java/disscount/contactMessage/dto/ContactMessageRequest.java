package disscount.contactMessage.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ContactMessageRequest {

    @Email(message = "Neispravan e-mail")
    private String email;

    private String fullName;

    @NotBlank(message = "Naslov je obavezan")
    private String subject;

    @NotBlank(message = "Poruka je obavezna")
    private String message;

    private String sourcePath;

    // Honeypot: must stay empty; bots fill it. Filled submissions are silently dropped.
    private String honeypot;
}
