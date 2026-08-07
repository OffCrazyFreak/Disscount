package disscount.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

import java.util.regex.Pattern;

/**
 * Matches one method and path only when the {@code id} segment is UUID-shaped.
 *
 * <p>This exists so the anonymous-capable chain is an allowlist on both axes. The obvious
 * alternative, matching {@code /api/shopping-lists/**} and subtracting the authenticated
 * routes, is a denylist nested inside an allowlist: the day somebody adds
 * {@code GET /api/shopping-lists/archived} it matches the wildcard, is absent from the
 * subtraction, and silently becomes readable without a token. Requiring a UUID excludes
 * every such literal automatically, including today's {@code /me} and {@code /items}, and
 * anything unlisted falls through to the authenticated chain rather than past it.
 *
 * <p>Canonical dashed form only, and stricter than {@link java.util.UUID#fromString},
 * which accepts "1-1-1-1-1". Bare 32-hex is deliberately excluded: Spring's
 * StringToUUIDConverter is UUID.fromString, which rejects it, so admitting it here would
 * let an anonymous caller reach the permitAll chain and get a logged 500 from a binding
 * failure on the one route with no token requirement.
 */
final class UuidScopedRequestMatcher implements RequestMatcher {

    private static final Pattern UUID_SHAPE = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");

    private final AntPathRequestMatcher delegate;

    UuidScopedRequestMatcher(HttpMethod method, String pattern) {
        this.delegate = new AntPathRequestMatcher(pattern, method.name());
    }

    @Override
    public boolean matches(HttpServletRequest request) {
        MatchResult result = delegate.matcher(request);
        if (!result.isMatch()) {
            return false;
        }

        String id = result.getVariables().get("id");
        return id != null && UUID_SHAPE.matcher(id).matches();
    }
}
