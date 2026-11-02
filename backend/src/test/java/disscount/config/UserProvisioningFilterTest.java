package disscount.config;

import disscount.user.service.AccountErasedException;
import disscount.user.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;

class UserProvisioningFilterTest {

    private final UserService userService = mock(UserService.class);
    private final UserProvisioningFilter filter = new UserProvisioningFilter(userService);
    private final UUID userId = UUID.randomUUID();

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void anErasedAccountIsAnsweredWithAccountErasedAndGoesNoFurther() throws Exception {
        Jwt jwt = Jwt.withTokenValue("token").header("alg", "ES256").subject(userId.toString())
                .claim("email", "a@example.com")
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60)).build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
        doThrow(new AccountErasedException()).when(userService)
                .ensureActiveProfile(eq(userId), any(), any(), any());
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(new MockHttpServletRequest("GET", "/api/users/me"), response, chain);

        assertThat(response.getStatus()).isEqualTo(410);
        assertThat(response.getContentAsString()).isEqualTo("{\"code\":\"account_erased\"}");
        assertThat(chain.getRequest()).isNull();
    }
}
