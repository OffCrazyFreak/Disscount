package disscount.user;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {

    private UUID id;
    @Schema(nullable = true)
    private String username;
    // null for /me (sourced from the better-auth session on the frontend); backfilled for the admin list.
    @Schema(nullable = true)
    private String email;
    // Exposed as enable-timestamps so the frontend renders switches via `!= null` and can show "enabled since".
    @Schema(nullable = true)
    private LocalDateTime notificationsPushEnabledAt;
    @Schema(nullable = true)
    private LocalDateTime notificationsEmailEnabledAt;
    @Schema(nullable = true)
    private LocalDateTime newsletterEnabledAt;
    @Schema(nullable = true)
    private LocalDateTime feedbackContactEnabledAt;
    @Schema(nullable = true)
    private AcquisitionChannel acquisitionChannel;
    @Schema(nullable = true)
    private String image;
    @Schema(nullable = true)
    private LocalDateTime onboardingCompletedAt;
    @Schema(nullable = true)
    private String onboardingOutcome;
    private AccountType accountType;
    private LocalDateTime createdAt;
    // Instant, because the dashboard does date maths and needs the offset; null for /me and once sessions expire.
    @Schema(nullable = true)
    private Instant lastLoginAt;
    // Last seen, and what the dashboard's active-user counters are built on.
    @Schema(nullable = true)
    private Instant lastActiveAt;
}
