package disscount.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

import java.util.regex.Pattern;

/** An allowlist on both axes, so a new literal route stays private; dashed only, as bare hex buys a logged 500. */
final class UuidScopedRequestMatcher implements RequestMatcher {

    private static final Pattern UUID_SHAPE = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");

    private final PathPatternRequestMatcher delegate;

    UuidScopedRequestMatcher(HttpMethod method, String pattern) {
        this.delegate = PathPatternRequestMatcher.pathPattern(method, pattern);
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
