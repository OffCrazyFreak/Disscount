package disscount.security;

import disscount.shared.UnauthorizedException;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.web.servlet.HandlerExceptionResolver;
import org.springframework.web.servlet.ModelAndView;

import java.io.IOException;

/** The chain's 401, written by GlobalExceptionHandler so it has the same problem shape as every other error. */
class ProblemAuthenticationEntryPoint implements AuthenticationEntryPoint {

    // Only for a presented token, as Spring does by default: RFC 6750 WWW-Authenticate naming why it failed.
    private final AuthenticationEntryPoint bearerHeaders = new BearerTokenAuthenticationEntryPoint();

    private final HandlerExceptionResolver exceptionResolver;

    ProblemAuthenticationEntryPoint(HandlerExceptionResolver exceptionResolver) {
        this.exceptionResolver = exceptionResolver;
    }

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
    ) throws IOException, ServletException {
        if (authException instanceof OAuth2AuthenticationException) {
            bearerHeaders.commence(request, response, authException);
        }

        ModelAndView handled = exceptionResolver.resolveException(request, response, null,
                new UnauthorizedException("problem.detail.unauthorized", authException));

        // Unhandled would leave the response at 200, so the status still goes out, only without the body.
        if (handled == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
        }
    }
}
