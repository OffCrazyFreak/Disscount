package disscount.security;

import disscount.shared.errors.ForbiddenException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.web.servlet.HandlerExceptionResolver;
import org.springframework.web.servlet.ModelAndView;

import java.io.IOException;

/** The chain's 403, written by GlobalExceptionHandler so it has the same problem shape as every other error. */
class ProblemAccessDeniedHandler implements AccessDeniedHandler {

    private final HandlerExceptionResolver exceptionResolver;

    ProblemAccessDeniedHandler(HandlerExceptionResolver exceptionResolver) {
        this.exceptionResolver = exceptionResolver;
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException
    ) throws IOException {
        ModelAndView handled = exceptionResolver.resolveException(request, response, null,
                new ForbiddenException("problem.detail.forbidden", accessDeniedException));

        // Unhandled would leave the response at 200, so the status still goes out, only without the body.
        if (handled == null) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
        }
    }
}
