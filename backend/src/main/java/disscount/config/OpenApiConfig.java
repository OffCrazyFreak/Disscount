package disscount.config;

import disscount.security.PublicRoutes;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import java.util.List;

/** Describes the API as callers reach it: through the Next.js proxy, which takes the session cookie and two headers. */
@Configuration
class OpenApiConfig {

    static final String WEB_CLIENT = "webClient";
    static final String ACCOUNT_PIN = "accountPin";
    static final String SESSION_COOKIE = "sessionCookie";

    private static final String DESCRIPTION = """
            Every call goes through the web app's proxy at `/api/...`. It refuses a call without \
            `X-Disscount-Client: web`, and it ignores any `Authorization` header: the proxy signs its own \
            short-lived token for Spring from the session cookie.

            A public route (the contact form, product photos, a shared list) needs only the client header \
            when you are not signed in. \
            Once you are signed in, every route also needs the session cookie, which the browser sends by itself after \
            you sign in on this site, and `X-Disscount-User` set to your account id, which \
            `GET /api/auth/get-session` returns as `user.id`. Each operation lists what it accepts; an account route \
            answers 401 without them.""";

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .components(new Components()
                        .addSecuritySchemes(WEB_CLIENT, header("X-Disscount-Client",
                                "Always `web`. The proxy's CSRF check refuses any call without it."))
                        .addSecuritySchemes(ACCOUNT_PIN, header("X-Disscount-User",
                                "The id of the account you expect to act as. When it names another account than "
                                        + "the session, the proxy answers 401 session_changed and calls nothing."))
                        .addSecuritySchemes(SESSION_COOKIE, new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.COOKIE)
                                .name("__Secure-better-auth.session_token")
                                .description("better-auth's session cookie, set when you sign in on this site. "
                                        + "On plain-HTTP localhost it is better-auth.session_token.")))
                // Relative, so the spec never names the internal backend host the Next.js proxy reaches it on.
                .addServersItem(new Server().url("/").description("The web app's proxy"))
                .info(new Info().title("Disscount API").version("1.0").description(DESCRIPTION));
    }

    /** Per operation, because a global alternative would apply to every route and promise the header alone works. */
    @Bean
    OpenApiCustomizer securityPerOperation() {
        return openApi -> openApi.getPaths().forEach((pathTemplate, pathItem) ->
                pathItem.readOperationsMap().forEach((method, operation) ->
                        describeSecurity(operation, HttpMethod.valueOf(method.name()), pathTemplate)));
    }

    private static void describeSecurity(Operation operation, HttpMethod method, String pathTemplate) {
        SecurityRequirement signedIn = new SecurityRequirement()
                .addList(WEB_CLIENT)
                .addList(ACCOUNT_PIN)
                .addList(SESSION_COOKIE);

        // A signed-in browser always sends its cookie, so the proxy then needs the pin even on a public route.
        List<SecurityRequirement> requirements = PublicRoutes.isPublic(method, pathTemplate)
                ? List.of(new SecurityRequirement().addList(WEB_CLIENT), signedIn)
                : List.of(signedIn);

        operation.setSecurity(requirements);
    }

    private static SecurityScheme header(String name, String description) {
        return new SecurityScheme()
                .type(SecurityScheme.Type.APIKEY)
                .in(SecurityScheme.In.HEADER)
                .name(name)
                .description(description);
    }
}
