package disscount.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import disscount.user.domain.enums.AcquisitionChannel;

@Data
public class UserRequest {
    @Size(min = 2, max = 40, message = "{validation.username.size}")
    @Schema(nullable = true)
    private String username;
    // Each toggle: null = leave unchanged, true = enable, false = disable.
    @Schema(nullable = true)
    private Boolean notificationsPush;
    @Schema(nullable = true)
    private Boolean notificationsEmail;
    @Schema(nullable = true)
    private Boolean newsletter;
    @Schema(nullable = true)
    private Boolean feedbackContact;
    @Schema(nullable = true)
    private AcquisitionChannel acquisitionChannel;

    // Base64 data URI; the client crops avatars to a 256px WebP or JPEG (~15-30 KB
    // encoded), so this is a generous abuse backstop and AvatarSanitizer checks the bytes.
    @Size(max = 400_000, message = "{validation.image.tooLarge}")
    @Schema(nullable = true)
    private String image;

    // Bounded: the column is a plain varchar(255), and skipped:\\d+ accepted any
    // number of digits, so an oversized value passed validation and then died as a
    // constraint violation, turning a 400 into a 500. The wizard has five steps.
    @Pattern(regexp = "completed|skipped:\\d{1,3}", message = "{validation.onboardingOutcome.invalid}")
    @Schema(nullable = true)
    private String onboardingOutcome;
}
