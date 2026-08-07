package disscount.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Authenticates a bearer token when one is present and usable, and lets the request through
 * anonymously when it is not.
 *
 * <p>This exists because a share link has to work for both. The standard
 * {@code BearerTokenAuthenticationFilter} rejects an expired or malformed token with 401
 * before authorization rules are consulted, so a permitAll endpoint is not actually reachable
 * by a caller whose cached token has gone stale. Dropping the resource server from the shared
 * chain instead would fix that but break the other half: a signed-in recipient would be seen
 * as anonymous and capped at VIEW however generous the link is.
 *
 * <p>Validation itself is unchanged and is not hand-rolled. This injects the same
 * {@code JwtDecoder} bean the resource server uses, so a token is still checked against the
 * better-auth JWKS, pinned to ES256, and validated for issuer and expiry. Only the response to
 * a failed check differs: continue anonymously instead of committing a 401. Spring's OAuth2
 * resource-server DSL has no supported way to express that, because its entry point commits
 * the response rather than continuing the chain.
 */
@Component
@RequiredArgsConstructor
public class OptionalBearerAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtDecoder jwtDecoder;
    private final JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain
    ) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        // RFC 7235 makes the scheme name case-insensitive. Our own client always sends
        // "Bearer", but a recipient arriving from anything else should not be silently
        // demoted to anonymous over capitalisation.
        if (header != null
                && header.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            try {
                Jwt jwt = jwtDecoder.decode(header.substring(BEARER_PREFIX.length()));
                SecurityContextHolder.getContext().setAuthentication(converter.convert(jwt));
            } catch (JwtException ignored) {
                // Expired, malformed or issued elsewhere. The caller keeps whatever the link
                // grants an anonymous visitor, which the access resolver caps at VIEW.
            }
        }

        chain.doFilter(request, response);
    }
}
