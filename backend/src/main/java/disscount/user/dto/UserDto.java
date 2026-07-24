package disscount.user.dto;

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
    private String username;
    // null for /me (sourced from the better-auth session on the frontend); backfilled for the admin list.
    private String email;
    // Preference toggles exposed as their actual enable-timestamps (null = off): the frontend renders
    // the switches via `!= null` and can also show "enabled since …" on a stats dashboard.
    private LocalDateTime notificationsPushEnabledAt;
    private LocalDateTime notificationsEmailEnabledAt;
    private LocalDateTime newsletterEnabledAt;
    private LocalDateTime feedbackContactEnabledAt;
    private AcquisitionChannel acquisitionChannel;
    private String image;
    private LocalDateTime onboardingCompletedAt;
    private String onboardingOutcome;
    private AccountType accountType;
    private LocalDateTime createdAt;
    // Instant rather than LocalDateTime so the JSON carries an offset: the dashboard does date
    // maths on these two, and an offset-less string is parsed as browser-local time.
    // Sign-in time, read from the better-auth `session` table; null for /me and for users
    // whose sessions have all been signed out or expired away.
    private Instant lastLoginAt;
    // Last seen, and what the dashboard's active-user counters are built on.
    private Instant lastActiveAt;
}
