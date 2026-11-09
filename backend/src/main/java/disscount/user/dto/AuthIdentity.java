package disscount.user.dto;

import java.time.Instant;

/** Owned by better-auth rather than app_user, so read via a native query and never mirrored. */
public record AuthIdentity(
        String email,
        Instant lastLoginAt,
        Instant lastSeenAt
) {
}
