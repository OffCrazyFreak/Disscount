package disscount.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import disscount.user.service.UserService;

import java.io.IOException;
import java.util.UUID;

/**
 * better-auth owns identity; the backend owns the business profile (`app_user`).
 * On each authenticated request we make sure the profile row exists, creating it
 * from the JWT claims (sub = user id, email) on first contact. This keeps every
 * per-user endpoint working without a separate sign-up sync step.
 */
@Component
@RequiredArgsConstructor
public class UserProvisioningFilter extends OncePerRequestFilter {

    private final UserService userService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            String email = jwt.getClaimAsString("email");

            try {
                UUID userId = UUID.fromString(jwt.getSubject());
                userService.ensureActiveProfile(userId, email);
            } catch (IllegalArgumentException ignored) {
                // `sub` isn't a UUID — not one of our users; skip provisioning.
            }
        }

        filterChain.doFilter(request, response);
    }
}
