package disscount.user.dto;

import java.time.LocalDateTime;

/**
 * Identity fields owned by better-auth rather than app_user: the email plus what its
 * `session` rows say about sign-ins. Read via a native query, never mirrored.
 */
public record AuthIdentity(
        String email,
        LocalDateTime lastLoginAt,
        LocalDateTime lastSeenAt
) {
}
