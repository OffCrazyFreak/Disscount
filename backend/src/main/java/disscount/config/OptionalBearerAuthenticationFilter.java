package disscount.config;

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

/** The standard filter rejects a stale token with 401 before authorization, so a permitAll share link needs this to continue anonymously. */
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

        // RFC 7235 makes the scheme case-insensitive, so a recipient should not be demoted to anonymous over capitalisation.
        if (header != null
                && header.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            try {
                Jwt jwt = jwtDecoder.decode(header.substring(BEARER_PREFIX.length()));
                if (!TokenPurpose.isPurposeScoped(jwt)) {
                    SecurityContextHolder.getContext().setAuthentication(converter.convert(jwt));
                }
            } catch (JwtException ignored) {
                // Expired, malformed or issued elsewhere: the caller keeps what the link grants anonymously, capped at VIEW.
            }
        }

        chain.doFilter(request, response);
    }
}
