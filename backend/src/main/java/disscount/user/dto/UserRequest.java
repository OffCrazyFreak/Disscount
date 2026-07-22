package disscount.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import disscount.user.domain.enums.AcquisitionChannel;

@Data
public class UserRequest {
    @Size(min = 2, max = 40, message = "Korisničko ime mora imati između 2 i 40 znakova")
    private String username;
    // Each toggle: null = leave unchanged, true = enable, false = disable.
    private Boolean notificationsPush;
    private Boolean notificationsEmail;
    private Boolean newsletter;
    private Boolean feedbackContact;
    private AcquisitionChannel acquisitionChannel;

    // Base64 data URI; the client downscales avatars to a 256px WebP (~15-30 KB
    // encoded), so this is a generous abuse backstop rather than the real limit.
    @Size(max = 400_000, message = "Slika je prevelika")
    private String image;

    @Pattern(regexp = "completed|skipped:\\d+", message = "Neispravan ishod vodiča")
    private String onboardingOutcome;
}
