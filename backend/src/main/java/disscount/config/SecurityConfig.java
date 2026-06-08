package disscount.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final PublicEndpointConfig publicEndpointConfig;
    private final UserProvisioningFilter userProvisioningFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> {
                // register all public matchers from the shared config
                publicEndpointConfig.getPublicMatchers().forEach(m -> authz.requestMatchers(m).permitAll());
                authz.anyRequest().authenticated();
            })
            // Validate better-auth JWTs via JWKS (jwk-set-uri configured in application.properties).
            // The principal name defaults to the `sub` claim, which is the better-auth user UUID,
            // so SecurityUtils.getCurrentUserId() keeps working unchanged.
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            // After authentication, make sure the user's business profile row exists.
            .addFilterAfter(userProvisioningFilter, BearerTokenAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, authEx) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized"))
                .accessDeniedHandler((req, res, accessEx) -> res.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden"))
            );

        return http.build();
    }
}
