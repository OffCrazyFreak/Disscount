package disscount.contactMessage.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContactMessageRequest {

    @Email(message = "Neispravan e-mail")
    @Size(max = 255, message = "E-mail može imati najviše 255 znakova")
    private String email;

    @Size(max = 255, message = "Ime može imati najviše 255 znakova")
    private String fullName;

    @NotBlank(message = "Naslov je obavezan")
    @Size(max = 255, message = "Naslov može imati najviše 255 znakova")
    private String subject;

    @NotBlank(message = "Poruka je obavezna")
    @Size(max = 5000, message = "Poruka može imati najviše 5000 znakova")
    private String message;

    @Size(max = 255, message = "Putanja može imati najviše 255 znakova")
    private String sourcePath;

    // Honeypot: must stay empty; bots fill it. Filled submissions are silently dropped.
    private String honeypot;
}
