package disccount.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PublicEndpointConfig {

    private final List<RequestMatcher> PUBLIC_MATCHERS = List.of(
        // Auth endpoints - registration/login/refresh open
        new AntPathRequestMatcher("/api/auth/register"),
        new AntPathRequestMatcher("/api/auth/login"),
        new AntPathRequestMatcher("/api/auth/refresh"),
        
        // Documentation - open (allow OpenAPI JSON + UI resources)
        new AntPathRequestMatcher("/v3/api-docs/**"),
        new AntPathRequestMatcher("/api-docs/**"),
        new AntPathRequestMatcher("/swagger-ui/**"),
        new AntPathRequestMatcher("/swagger-ui.html"),

        // User existence checks - open (for registration validation)
        new AntPathRequestMatcher("/api/users/exists/**"),

        // Get all users - open (for testing purposes - TODO: remove)
        new AntPathRequestMatcher("/api/users", "GET")
    );

    public List<RequestMatcher> getPublicMatchers() {
        return PUBLIC_MATCHERS;
    }

    public boolean isPublic(HttpServletRequest request) {
        for (RequestMatcher matcher : PUBLIC_MATCHERS) {
            if (matcher.matches(request)) return true;
        }
        return false;
    }
}
