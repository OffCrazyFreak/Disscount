package disscount.config;

import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PublicEndpointConfig {

    private final List<RequestMatcher> PUBLIC_MATCHERS = List.of(
        // Documentation - open (allow OpenAPI JSON + UI resources)
        new AntPathRequestMatcher("/v3/api-docs/**"),
        new AntPathRequestMatcher("/api-docs/**"),
        new AntPathRequestMatcher("/swagger-ui/**"),
        new AntPathRequestMatcher("/swagger-ui.html")
    );

    public List<RequestMatcher> getPublicMatchers() {
        return PUBLIC_MATCHERS;
    }
}
