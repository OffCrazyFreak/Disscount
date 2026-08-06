package disscount.config;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserProvisioningFilter userProvisioningFilter;

    @Bean
    public JwtDecoder jwtDecoder(
            @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwksUri,
            @Value("${better.auth.issuer}") String issuer
    ) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder
                .withJwkSetUri(jwksUri)
                .jwsAlgorithm(SignatureAlgorithm.ES256)
                .build();

        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(issuer));

        return decoder;
    }

    /**
     * Spring Boot auto-registers every {@code Filter} bean into the servlet chain, so a
     * {@code @Component} filter meant only for a security chain runs twice: once where it was
     * placed and once for every request that never reaches that chain. Both of these extend
     * {@code OncePerRequestFilter}, whose already-filtered attribute makes the second run a
     * no-op only when the first one happened, so on any path outside {@code /api/shared/**}
     * the optional bearer filter would decode the token again after the real chain had
     * finished with it. These beans turn the servlet registration off and leave the security
     * chains as the only place either filter runs.
     */
    @Bean
    public FilterRegistrationBean<UserProvisioningFilter> userProvisioningFilterRegistration(
            UserProvisioningFilter filter
    ) {
        FilterRegistrationBean<UserProvisioningFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public FilterRegistrationBean<OptionalBearerAuthenticationFilter> optionalBearerFilterRegistration(
            OptionalBearerAuthenticationFilter filter
    ) {
        FilterRegistrationBean<OptionalBearerAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    /**
     * Shared lists get their own chain because they are the one place where a bearer token is
     * optional. Authorization happens on the share token plus ShoppingListAccessService, and
     * the caller may legitimately be anonymous, so a token that fails to decode must degrade
     * to anonymous rather than 401. permitAll on the main chain cannot express that: its
     * bearer filter rejects a stale token before authorization is ever consulted.
     */
    @Bean
    @Order(1)
    public SecurityFilterChain sharedShoppingListChain(
            HttpSecurity http,
            OptionalBearerAuthenticationFilter optionalBearerAuthenticationFilter
    ) throws Exception {
        http
            .securityMatcher("/api/shared/**")
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz.anyRequest().permitAll())
            // Both are anchored on the slot where a bearer token is normally decoded, which
            // is where these two belong and which leaves them 98 places of headroom before
            // the next registered filter. addFilterAfter is order + 1, so this is bearer at
            // +1 and provisioning at +2: a strict sequence, which provisioning needs because
            // it acts on the authentication the bearer filter produced. Anchoring either one
            // on AnonymousAuthenticationFilter instead lands exactly on top of it, since a
            // before is order - 1 and the following after adds the 1 straight back, and the
            // resulting tie is broken only by the sort happening to be stable.
            .addFilterAfter(optionalBearerAuthenticationFilter, BearerTokenAuthenticationFilter.class)
            .addFilterAfter(userProvisioningFilter, OptionalBearerAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                .requestMatchers(HttpMethod.POST, "/api/contact").permitAll()
                .requestMatchers(
                    "/actuator/health",
                    "/v3/api-docs/**",
                    "/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, authEx) ->
                    res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized"))
                .accessDeniedHandler((req, res, accessEx) ->
                    res.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden"))
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .addFilterAfter(userProvisioningFilter, BearerTokenAuthenticationFilter.class);

        return http.build();
    }
}
