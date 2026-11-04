package disscount.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

import disscount.user.domain.enums.AccountType;
import disscount.user.domain.enums.AcquisitionChannel;

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
    // Preference toggles exposed as their actual enable-timestamps (null = off): the frontend renders
    // the switches via `!= null` and can also show "enabled since …" on a stats dashboard.
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
    // Instant, not LocalDateTime: the dashboard does date maths and needs the offset.
    // Sign-in time from the better-auth `session` table; null for /me and once sessions expire.
    @Schema(nullable = true)
    private Instant lastLoginAt;
    // Last seen, and what the dashboard's active-user counters are built on.
    @Schema(nullable = true)
    private Instant lastActiveAt;
}
