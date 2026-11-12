package disscount.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OptionalBearerAuthenticationFilterTest {

    private final JwtDecoder decoder = mock(JwtDecoder.class);
    private final OptionalBearerAuthenticationFilter filter = new OptionalBearerAuthenticationFilter(decoder);

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private Authentication authenticationSeenFor(Jwt jwt) throws Exception {
        when(decoder.decode("token")).thenReturn(jwt);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/shopping-lists/x");
        request.addHeader("Authorization", "Bearer token");
        AtomicReference<Authentication> seen = new AtomicReference<>();

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest req, jakarta.servlet.ServletResponse res) {
                seen.set(SecurityContextHolder.getContext().getAuthentication());
            }
        });
        return seen.get();
    }

    private static Jwt.Builder token() {
        return Jwt.withTokenValue("token").header("alg", "ES256").subject("user-1")
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60));
    }

    @Test
    void aSessionTokenSignsTheCallerIn() throws Exception {
        assertThat(authenticationSeenFor(token().build())).isNotNull();
    }

    @Test
    void anAccountErasureTokenStaysAnonymousOnSharedLists() throws Exception {
        assertThat(authenticationSeenFor(token().claim("purpose", "account-erasure").build())).isNull();
    }
}
