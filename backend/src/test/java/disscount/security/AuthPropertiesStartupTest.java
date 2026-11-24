package disscount.security;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

import static org.assertj.core.api.Assertions.assertThat;

/** Production sets these keys from env placeholders with no default, so a missing variable must stop startup. */
class AuthPropertiesStartupTest {

    private static final String JWKS = "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=";
    private static final String ISSUER = "better.auth.issuer=";

    @Configuration
    @EnableConfigurationProperties({JwkSetProperties.class, BetterAuthProperties.class})
    static class Properties {
    }

    private final ApplicationContextRunner runner = new ApplicationContextRunner().withUserConfiguration(Properties.class);

    @Test
    void setValuesBindUnchanged() {
        runner.withPropertyValues(JWKS + "http://localhost:3000/api/auth/jwks", ISSUER + "http://localhost:3000")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context.getBean(BetterAuthProperties.class).issuer()).hasToString("http://localhost:3000");
                    assertThat(context.getBean(JwkSetProperties.class).jwkSetUri())
                            .hasToString("http://localhost:3000/api/auth/jwks");
                });
    }

    @Test
    void anUnsetIssuerVariableStopsStartup() {
        runner.withPropertyValues(JWKS + "http://localhost:3000/api/auth/jwks", ISSUER + "${DISSCOUNT_TEST_UNSET_ISSUER}")
                .run(context -> assertThat(context).hasFailed());
    }

    @Test
    void anUnsetJwksVariableStopsStartup() {
        runner.withPropertyValues(JWKS + "${DISSCOUNT_TEST_UNSET_JWKS}", ISSUER + "http://localhost:3000")
                .run(context -> assertThat(context).hasFailed());
    }

    @Test
    void anEmptyIssuerStopsStartup() {
        runner.withPropertyValues(JWKS + "http://localhost:3000/api/auth/jwks", ISSUER)
                .run(context -> assertThat(context).hasFailed());
    }

    @Test
    void anEmptyJwksUrlStopsStartup() {
        runner.withPropertyValues(JWKS, ISSUER + "http://localhost:3000")
                .run(context -> assertThat(context).hasFailed());
    }

    @Test
    void aMissingKeyStopsStartup() {
        runner.withPropertyValues(JWKS + "http://localhost:3000/api/auth/jwks")
                .run(context -> assertThat(context).hasFailed());

        runner.withPropertyValues(ISSUER + "http://localhost:3000")
                .run(context -> assertThat(context).hasFailed());
    }
}
