package disscount.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

record UserRequest(
        @Size(min = 2, max = 40, message = "{validation.username.size}")
        @Schema(nullable = true)
        String username,

        // Each toggle: null = leave unchanged, true = enable, false = disable.
        @Schema(nullable = true)
        Boolean notificationsPush,

        @Schema(nullable = true)
        Boolean notificationsEmail,

        @Schema(nullable = true)
        Boolean newsletter,

        @Schema(nullable = true)
        Boolean feedbackContact,

        @Schema(nullable = true)
        AcquisitionChannel acquisitionChannel,

        // The column is varchar(255), and an unbounded digit run would pass validation and die as a 500; five wizard steps.
        @Pattern(regexp = "completed|skipped:\\d{1,3}", message = "{validation.onboardingOutcome.invalid}")
        @Schema(nullable = true)
        String onboardingOutcome) {
}
