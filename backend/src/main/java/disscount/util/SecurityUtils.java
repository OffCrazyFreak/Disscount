package disscount.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

public class SecurityUtils {

    public static UUID getCurrentUserId() {
        return getCurrentUserIdOptional().orElseThrow(() ->
                new IllegalStateException("No user with a valid id in the security context; protected endpoints always have one"));
    }

    /**
     * Resolve the current user's ID if the request is authenticated, else empty.
     * Safe on public endpoints where the caller may be anonymous.
     */
    public static Optional<UUID> getCurrentUserIdOptional() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return Optional.empty();
        }

        try {
            return Optional.of(UUID.fromString(authentication.getName()));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
