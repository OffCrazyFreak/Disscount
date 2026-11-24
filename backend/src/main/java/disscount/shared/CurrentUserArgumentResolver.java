package disscount.shared;

import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.UUID;

class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        if (!parameter.hasParameterAnnotation(CurrentUser.class)) {
            return false;
        }

        // Thrown rather than skipped, so a misplaced annotation cannot fall through to binding a query parameter.
        if (parameter.getParameterType() != UUID.class) {
            throw new IllegalStateException("@CurrentUser goes on a UUID parameter: " + parameter);
        }

        return true;
    }

    @Override
    public Object resolveArgument(
            MethodParameter parameter,
            ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest,
            WebDataBinderFactory binderFactory
    ) {
        UUID userId = currentUserId();
        boolean required = parameter.getParameterAnnotation(CurrentUser.class).required();

        if (userId == null && required) {
            throw new IllegalStateException(
                    "No user id in the security context; a required @CurrentUser belongs on a route that needs a login");
        }

        return userId;
    }

    /** Null for an anonymous caller, or a token whose subject is not one of our user ids. */
    private static UUID currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return null;
        }

        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException notAUserId) {
            return null;
        }
    }
}
