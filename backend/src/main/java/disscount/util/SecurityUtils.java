package disscount.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

public class SecurityUtils {

    /**
     * Get the currently authenticated user's ID from the Spring Security context
     * This method assumes authentication has already been verified by the security filter
     * @return UUID of the authenticated user
     * @throws IllegalStateException if no authenticated user is found (should not happen for protected endpoints)
     */
    public static UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalStateException("No authenticated user found - this should not happen for protected endpoints");
        }
        
        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Invalid user ID format in authentication context");
        }
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
