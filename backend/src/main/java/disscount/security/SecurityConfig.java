package disscount.security;

import disscount.user.ActiveUsers;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
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
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.util.function.Supplier;

/** The one-off erasure profiles run without a web server, which has no MVC exception resolver for the chain. */
@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@EnableWebSecurity
// So a @WebMvcTest slice that imports only this chain still runs the @PreAuthorize guards.
@Import(MethodSecurityConfig.class)
@EnableConfigurationProperties({JwkSetProperties.class, BetterAuthProperties.class})
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserProvisioningFilter userProvisioningFilter;
    private final ActiveUsers activeUsers;

    @Bean
    public JwtDecoder jwtDecoder(JwkSetProperties jwkSet, BetterAuthProperties betterAuth) {
        String issuer = betterAuth.issuer().toString();

        NimbusJwtDecoder decoder = NimbusJwtDecoder
                .withJwkSetUri(jwkSet.jwkSetUri().toString())
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
            .securityMatcher(PublicRoutes.sharedListMatcher())
            // The browser never reaches Spring: only the Next.js proxy calls it, and the proxy runs the CSRF checks.
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

    @Bean
    @Order(2)
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            @Qualifier("handlerExceptionResolver") HandlerExceptionResolver exceptionResolver
    ) throws Exception {
        AuthenticationEntryPoint entryPoint = new ProblemAuthenticationEntryPoint(exceptionResolver);

        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                .requestMatchers(PublicRoutes.openMatchers()).access(SecurityConfig::isNotPurposeScoped)
                // Only the deleteUser hook mints this, so a session token cannot erase the profile and keep its login.
                .requestMatchers(HttpMethod.DELETE, "/api/users/me").access(SecurityConfig::isAccountErasureToken)
                .requestMatchers("/actuator/health").permitAll()
                // The docs are public and read-only; each route they describe keeps its own rule here.
                .requestMatchers(HttpMethod.GET,
                    "/api/v3/api-docs/**",
                    "/api/swagger-ui/**",
                    "/api/swagger-ui.html"
                ).permitAll()
                .requestMatchers("/api/admin/**").access(new AdminAuthorizationManager(activeUsers))
                .anyRequest().access(SecurityConfig::isOrdinarySessionToken)
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(entryPoint)
                .accessDeniedHandler(new ProblemAccessDeniedHandler(exceptionResolver))
            )
            // Its own entry point answers a token that fails to decode, before the one above is consulted.
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(Customizer.withDefaults())
                .authenticationEntryPoint(entryPoint))
            .addFilterAfter(userProvisioningFilter, BearerTokenAuthenticationFilter.class);

        return http.build();
    }
}
