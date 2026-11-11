package disscount.security;

import org.springframework.http.HttpMethod;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

import java.util.List;
import java.util.stream.Stream;

/** The API routes anyone may call: SecurityConfig authorizes from this list and the API docs describe it. */
public final class PublicRoutes {

    record Route(HttpMethod method, String pattern) {

        /** Compares against a path template from the API docs the way the request matcher would compare a path. */
        boolean describes(HttpMethod operationMethod, String pathTemplate) {
            if (!method.equals(operationMethod)) {
                return false;
            }

            String[] patternSegments = pattern.split("/");
            String[] templateSegments = pathTemplate.split("/");
            if (patternSegments.length != templateSegments.length) {
                return false;
            }

            for (int i = 0; i < patternSegments.length; i++) {
                if (!segmentDescribes(patternSegments[i], templateSegments[i])) {
                    return false;
                }
            }

            return true;
        }

        /** A wildcard matches any segment, as in a request; a named variable is UUID scoped, so only a variable. */
        private static boolean segmentDescribes(String patternSegment, String templateSegment) {
            if (patternSegment.equals("*")) {
                return true;
            }

            return isVariable(patternSegment) ? isVariable(templateSegment) : patternSegment.equals(templateSegment);
        }

        private static boolean isVariable(String segment) {
            return segment.startsWith("{") && segment.endsWith("}");
        }
    }

    // Product photos are public like the prices; uploads and reports still need a login.
    static final List<Route> OPEN = List.of(
            new Route(HttpMethod.POST, "/api/contact"),
            new Route(HttpMethod.GET, "/api/products/*/images"),
            new Route(HttpMethod.GET, "/api/products/images/thumbnails"),
            new Route(HttpMethod.GET, "/api/products/catalog/eans"));

    /** A list is shared at its own URL, so these take an optional token and ShoppingListService decides access. */
    static final List<Route> SHARED_LIST = List.of(
            new Route(HttpMethod.GET, "/api/shopping-lists/{id}"),
            // Link unfurlers probe with HEAD, which the matcher compares exactly.
            new Route(HttpMethod.HEAD, "/api/shopping-lists/{id}"),
            new Route(HttpMethod.PUT, "/api/shopping-lists/{id}"),
            new Route(HttpMethod.DELETE, "/api/shopping-lists/{id}"),
            new Route(HttpMethod.POST, "/api/shopping-lists/{id}/items"),
            new Route(HttpMethod.POST, "/api/shopping-lists/{id}/copy"),
            new Route(HttpMethod.PUT, "/api/shopping-lists/{id}/items/{itemId}"),
            new Route(HttpMethod.DELETE, "/api/shopping-lists/{id}/items/{itemId}"));

    private PublicRoutes() {
    }

    public static boolean isPublic(HttpMethod method, String pathTemplate) {
        return Stream.concat(OPEN.stream(), SHARED_LIST.stream())
                .anyMatch(route -> route.describes(method, pathTemplate));
    }

    static RequestMatcher[] openMatchers() {
        return OPEN.stream()
                .map(route -> PathPatternRequestMatcher.pathPattern(route.method(), route.pattern()))
                .toArray(RequestMatcher[]::new);
    }

    /** Unlisted methods fall through to the authenticated chain, so the default is deny. */
    static RequestMatcher sharedListMatcher() {
        return new OrRequestMatcher(SHARED_LIST.stream()
                .<RequestMatcher>map(route -> new UuidScopedRequestMatcher(route.method(), route.pattern()))
                .toList());
    }
}
