package disscount.config;

import org.springframework.security.oauth2.jwt.Jwt;

/** These share the session tokens' signing keys, so each must be accepted only where its purpose is the point (RFC 8725, 3.12). */
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
