package disscount.security;

import disscount.user.ActiveUsers;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtAudienceValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

import java.util.function.Supplier;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserProvisioningFilter userProvisioningFilter;
    private final ActiveUsers activeUsers;

    @Bean
    public JwtDecoder jwtDecoder(
            @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwksUri,
            @Value("${better.auth.issuer}") String issuer
    ) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder
                .withJwkSetUri(jwksUri)
                .jwsAlgorithm(SignatureAlgorithm.ES256)
                .build();

        // better-auth sets aud to the same base URL as iss, so no separate setting is needed (RFC 8725, 3.9).
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuer),
                new JwtAudienceValidator(issuer)));

        return decoder;
    }

    /** Turns off servlet auto-registration, so each filter runs only in its chain and decodes the token once. */
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

    /** A failed decode degrades to anonymous; nothing here authorizes, so ShoppingListService is the boundary. */
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
            // Anchored on the bearer slot so provisioning lands after it, as AnonymousAuthenticationFilter ties there.
            .addFilterAfter(optionalBearerAuthenticationFilter, BearerTokenAuthenticationFilter.class)
            .addFilterAfter(userProvisioningFilter, OptionalBearerAuthenticationFilter.class);

        return http.build();
    }

    private static AuthorizationDecision isAccountErasureToken(
            Supplier<? extends Authentication> authentication,
            RequestAuthorizationContext context
    ) {
        boolean isErasureToken = authentication.get() instanceof JwtAuthenticationToken jwt
                && TokenPurpose.isAccountErasure(jwt.getToken());
        return new AuthorizationDecision(isErasureToken);
    }

    private static AuthorizationDecision isOrdinarySessionToken(
            Supplier<? extends Authentication> authentication,
            RequestAuthorizationContext context
    ) {
        boolean isOrdinary = authentication.get() instanceof JwtAuthenticationToken jwt
                && !TokenPurpose.isPurposeScoped(jwt.getToken());
        return new AuthorizationDecision(isOrdinary);
    }

    /** The public routes' rule: anyone, signed in or not, except a purpose scoped token. */
    private static AuthorizationDecision isNotPurposeScoped(
            Supplier<? extends Authentication> authentication,
            RequestAuthorizationContext context
    ) {
        boolean isPurposeScoped = authentication.get() instanceof JwtAuthenticationToken jwt
                && TokenPurpose.isPurposeScoped(jwt.getToken());
        return new AuthorizationDecision(!isPurposeScoped);
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
                .requestMatchers(HttpMethod.POST, "/api/contact").access(SecurityConfig::isNotPurposeScoped)
                // Only the deleteUser hook mints this, so a session token cannot erase the profile and keep its login.
                .requestMatchers(HttpMethod.DELETE, "/api/users/me").access(SecurityConfig::isAccountErasureToken)
                // Product photos are public like the prices; uploads and reports still need a login.
                .requestMatchers(HttpMethod.GET, "/api/products/*/images", "/api/products/images/thumbnails",
                        "/api/products/catalog/eans").access(SecurityConfig::isNotPurposeScoped)
                .requestMatchers(
                    "/actuator/health",
                    "/v3/api-docs/**",
                    "/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()
                .requestMatchers("/api/admin/**").access(new AdminAuthorizationManager(activeUsers))
                .anyRequest().access(SecurityConfig::isOrdinarySessionToken)
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
