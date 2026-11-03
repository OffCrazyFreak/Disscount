package disscount.config;

import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Purpose-scoped tokens share the session tokens' signing keys, so each one must be accepted
 * only where its purpose is the point and refused everywhere else (RFC 8725, section 3.12).
 */
final class TokenPurpose {

    // Shared with frontend/src/lib/auth/erase-backend-account.ts, which signs the token.
    static final String CLAIM = "purpose";
    static final String ACCOUNT_ERASURE = "account-erasure";

    private TokenPurpose() {
    }

    static boolean isPurposeScoped(Jwt jwt) {
        return jwt.hasClaim(CLAIM);
    }

    static boolean isAccountErasure(Jwt jwt) {
        return ACCOUNT_ERASURE.equals(jwt.getClaimAsString(CLAIM));
    }
}
