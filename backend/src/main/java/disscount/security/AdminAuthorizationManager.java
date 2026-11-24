package disscount.security;

import disscount.user.ActiveUsers;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.authorization.AuthorizationResult;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;

/** The one rule for /api/admin/**: an ordinary session token whose account is a live ADMIN. */
@RequiredArgsConstructor
class AdminAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {

    private final ActiveUsers activeUsers;

    /** Looked up per request rather than read from the token, so a demotion or deletion applies at once. */
    @Override
    public AuthorizationResult authorize(
            Supplier<? extends Authentication> authentication,
            RequestAuthorizationContext context
    ) {
        boolean isAdmin = sessionSubject(authentication.get())
                .filter(activeUsers::isActiveAdmin)
                .isPresent();

        return new AuthorizationDecision(isAdmin);
    }

    private static Optional<UUID> sessionSubject(Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken token)) {
            return Optional.empty();
        }

        Jwt jwt = token.getToken();
        if (TokenPurpose.isPurposeScoped(jwt) || jwt.getSubject() == null) {
            return Optional.empty();
        }

        try {
            return Optional.of(UUID.fromString(jwt.getSubject()));
        } catch (IllegalArgumentException notOurToken) {
            return Optional.empty();
        }
    }
}
