package disscount.user.dto;

import java.time.Instant;

/**
 * Identity fields owned by better-auth rather than app_user: the email, the last login
 * stamped on its `user` row, and what its `session` rows say about activity. Read via a
 * native query, never mirrored.
 */
public record AuthIdentity(
        String email,
        Instant lastLoginAt,
        Instant lastSeenAt
) {
}
