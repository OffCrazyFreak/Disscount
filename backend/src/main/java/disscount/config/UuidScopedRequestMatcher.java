package disscount.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

import java.util.regex.Pattern;

/**
 * Matches one method and path only when the {@code id} segment is UUID-shaped.
 *
 * <p>An allowlist on both axes. A wildcard minus the authenticated routes would be a
 * denylist inside an allowlist, silently exposing the next literal route somebody adds;
 * requiring a UUID excludes {@code /me}, {@code /items} and any future literal for free.
 *
 * <p>Canonical dashed form only. Bare 32-hex is excluded because Spring's
 * StringToUUIDConverter rejects it, so it would only buy an anonymous caller a logged 500.
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
