package disscount.security;

import java.net.URI;

import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** Reads Spring's own key as a URI, so an unset BETTER_AUTH_JWKS_URI fails startup like BetterAuthProperties. */
@Validated
@ConfigurationProperties("spring.security.oauth2.resourceserver.jwt")
record JwkSetProperties(@NotNull URI jwkSetUri) {
}
