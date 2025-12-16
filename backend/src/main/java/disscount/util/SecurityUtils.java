package disscount.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

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
     * Check if there's an authenticated user
     * @return true if user is authenticated, false otherwise
     */
    public static boolean isAuthenticated() {
        return getCurrentUserId() != null;
    }
}
