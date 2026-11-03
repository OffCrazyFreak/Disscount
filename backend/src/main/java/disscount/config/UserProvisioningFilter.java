package disscount.config;

import disscount.user.service.AccountErasedException;
import disscount.user.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserProvisioningFilter extends OncePerRequestFilter {

    private final UserService userService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain
    ) throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // A purpose scoped token, such as the account erasure one, must never create or revive a profile.
        if (auth instanceof JwtAuthenticationToken jwtAuth && !TokenPurpose.isPurposeScoped(jwtAuth.getToken())) {
            String sub = jwtAuth.getToken().getSubject();
            String email = jwtAuth.getToken().getClaimAsString("email");
            String name = jwtAuth.getToken().getClaimAsString("name");
            String image = jwtAuth.getToken().getClaimAsString("image");

            try {
                userService.ensureActiveProfile(UUID.fromString(sub), email, name, image);
            } catch (AccountErasedException erased) {
                // Gone rather than 401, so the client finishes the deletion instead of refreshing its token.
                response.setStatus(HttpServletResponse.SC_GONE);
                response.setContentType("application/json");
                // The id lets the browser check its session still names this account before deleting it.
                response.getWriter().write("{\"code\":\"account_erased\",\"userId\":\"" + UUID.fromString(sub) + "\"}");
                return;
            } catch (IllegalArgumentException ignored) {
                // sub is not a UUID - token not issued by our better-auth instance
            } catch (Exception e) {
                log.error("User provisioning failed for sub={}: {}", sub, e.getMessage(), e);
                response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Service unavailable");
                return;
            }
        }

        chain.doFilter(request, response);
    }
}
