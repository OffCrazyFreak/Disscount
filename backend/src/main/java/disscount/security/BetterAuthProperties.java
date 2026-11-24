package disscount.security;

import java.net.URI;

import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** A URI, so an unset BETTER_AUTH_ISSUER (left as its placeholder text) fails startup instead of every login. */
@Validated
@ConfigurationProperties("better.auth")
record BetterAuthProperties(@NotNull URI issuer) {
}
