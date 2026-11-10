package disscount.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/** A stale token must not 401 a share link; dropping the resource server would demote signed-in recipients to VIEW. */
@Component
@RequiredArgsConstructor
class OptionalBearerAuthenticationFilter extends OncePerRequestFilter {

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

        // RFC 7235 makes the scheme case-insensitive, so capitalisation must not demote a recipient to anonymous.
        if (header != null
                && header.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            try {
                Jwt jwt = jwtDecoder.decode(header.substring(BEARER_PREFIX.length()));
                if (!TokenPurpose.isPurposeScoped(jwt)) {
                    SecurityContextHolder.getContext().setAuthentication(converter.convert(jwt));
                }
            } catch (JwtException ignored) {
                // Expired, malformed or foreign: the caller keeps what the link grants anonymously, capped at VIEW.
            }
        }

        chain.doFilter(request, response);
    }
}
