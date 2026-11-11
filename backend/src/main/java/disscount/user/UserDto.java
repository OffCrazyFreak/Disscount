package disscount.user;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@Builder(toBuilder = true)
public record UserDto(
        UUID id,
        @Schema(nullable = true) String username,

        // null for /me (sourced from the better-auth session on the frontend); backfilled for the admin list.
        @Schema(nullable = true) String email,

        // Exposed as enable-timestamps so the frontend renders switches via `!= null` and can show "enabled since".
        @Schema(nullable = true) LocalDateTime notificationsPushEnabledAt,
        @Schema(nullable = true) LocalDateTime notificationsEmailEnabledAt,
        @Schema(nullable = true) LocalDateTime newsletterEnabledAt,
        @Schema(nullable = true) LocalDateTime feedbackContactEnabledAt,

        @Schema(nullable = true) AcquisitionChannel acquisitionChannel,
        @Schema(nullable = true) String image,
        @Schema(nullable = true) LocalDateTime onboardingCompletedAt,
        @Schema(nullable = true) String onboardingOutcome,
        AccountType accountType,
        LocalDateTime createdAt,

        // Instant, because the dashboard does date maths and needs the offset; null for /me and once sessions expire.
        @Schema(nullable = true) Instant lastLoginAt,

        // Last seen, and what the dashboard's active-user counters are built on.
        @Schema(nullable = true) Instant lastActiveAt) {

    /** No email: the current user reads the session, and the admin list adds it through {@link #withIdentity}. */
    static UserDto from(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .notificationsPushEnabledAt(user.getNotificationsPushEnabledAt())
                .notificationsEmailEnabledAt(user.getNotificationsEmailEnabledAt())
                .newsletterEnabledAt(user.getNewsletterEnabledAt())
                .feedbackContactEnabledAt(user.getFeedbackContactEnabledAt())
                .acquisitionChannel(user.getAcquisitionChannel())
                .image(user.getImage())
                .onboardingCompletedAt(user.getOnboardingCompletedAt())
                .onboardingOutcome(user.getOnboardingOutcome())
                .accountType(user.getAccountType())
                .createdAt(user.getCreatedAt())
                .lastActiveAt(toUtcInstant(user.getLastActiveAt()))
                .build();
    }

    UserDto withIdentity(AuthIdentity identity) {
        if (identity == null) return this;

        return toBuilder()
                .email(identity.email())
                .lastLoginAt(identity.lastLoginAt())
                // The stamped column starts at this feature's rollout, so surviving session rows fill in the history behind it.
                .lastActiveAt(latestOf(lastActiveAt, identity.lastSeenAt()))
                .build();
    }

    // The column is zone-less but written by Timestamps.nowUtc(), so UTC is the offset it was stamped with.
    private static Instant toUtcInstant(LocalDateTime value) {
        return value == null ? null : value.toInstant(ZoneOffset.UTC);
    }

    private static Instant latestOf(Instant first, Instant second) {
        if (first == null) return second;
        if (second == null) return first;
        return first.isAfter(second) ? first : second;
    }
}
