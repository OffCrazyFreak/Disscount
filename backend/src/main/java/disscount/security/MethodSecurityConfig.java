package disscount.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

/** Apart from the web-only SecurityConfig, so the @PreAuthorize guards (docs/BACKEND.md) run without a web server too. */
@Configuration
@EnableMethodSecurity
class MethodSecurityConfig {
}
