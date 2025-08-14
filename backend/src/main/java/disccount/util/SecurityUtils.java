package disccount.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public class SecurityUtils {

    /**
     * Get the currently authenticated user's ID from the Spring Security context
     * @return UUID of the authenticated user, or null if not authenticated
     */
    public static UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        
        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException e) {
            return null;
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
