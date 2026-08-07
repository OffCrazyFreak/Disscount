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
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

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
     * no-op only when the first one happened, so on any path outside the optional-auth chain
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
     * The by-id shopping list routes, which are the one place a bearer token is optional.
     * A list is shared by its own id, so the caller may legitimately be anonymous and a token
     * that fails to decode must degrade to anonymous rather than 401. permitAll on the main
     * chain cannot express that: its bearer filter rejects a stale token before authorization
     * is ever consulted.
     *
     * <p><b>Nothing here authorizes anything.</b> The rule is {@code permitAll}, so the
     * access checks in {@link disscount.shoppingList.service.ShoppingListService} are an
     * authentication boundary: relaxing one removes authentication, not a convenience.
     */
    @Bean
    @Order(1)
    public SecurityFilterChain optionalAuthShoppingListChain(
            HttpSecurity http,
            OptionalBearerAuthenticationFilter optionalBearerAuthenticationFilter
    ) throws Exception {
        http
            .securityMatcher(shoppingListByIdMatcher())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz.anyRequest().permitAll())
            // Anchored on the bearer slot so provisioning lands strictly after it. Anchoring
            // on AnonymousAuthenticationFilter ties with it, since before is -1 and the
            // following after adds the 1 straight back.
            .addFilterAfter(optionalBearerAuthenticationFilter, BearerTokenAuthenticationFilter.class)
            .addFilterAfter(userProvisioningFilter, OptionalBearerAuthenticationFilter.class);

        return http.build();
    }

    /** Unlisted methods fall through to the authenticated chain, so the default is deny. */
    private static RequestMatcher shoppingListByIdMatcher() {
        return new OrRequestMatcher(
                new UuidScopedRequestMatcher(HttpMethod.GET, "/api/shopping-lists/{id}"),
                // Link unfurlers probe with HEAD, which the matcher compares exactly.
                new UuidScopedRequestMatcher(HttpMethod.HEAD, "/api/shopping-lists/{id}"),
                new UuidScopedRequestMatcher(HttpMethod.PUT, "/api/shopping-lists/{id}"),
                new UuidScopedRequestMatcher(HttpMethod.DELETE, "/api/shopping-lists/{id}"),
                new UuidScopedRequestMatcher(HttpMethod.POST, "/api/shopping-lists/{id}/items"),
                new UuidScopedRequestMatcher(HttpMethod.POST, "/api/shopping-lists/{id}/copy"),
                new UuidScopedRequestMatcher(HttpMethod.PUT, "/api/shopping-lists/{id}/items/{itemId}"),
                new UuidScopedRequestMatcher(HttpMethod.DELETE, "/api/shopping-lists/{id}/items/{itemId}"));
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
