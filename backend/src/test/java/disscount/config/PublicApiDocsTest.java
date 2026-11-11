package disscount.config;

import disscount.productimage.openfoodfacts.OpenFoodFactsClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Boots from main's resources with no profile, as dev and production do, because the test application.properties
 * replaces main's. Only the variables production sets and an H2 database are filled in here.
 */
@SpringBootTest(properties = {
        "spring.config.location=file:src/main/resources/",
        "SPRING_DATASOURCE_URL=jdbc:h2:mem:api-docs;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "SPRING_DATASOURCE_USERNAME=sa",
        "SPRING_DATASOURCE_PASSWORD=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.hikari.data-source-properties.logServerErrorDetail=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "BETTER_AUTH_JWKS_URI=http://localhost:3000/api/auth/jwks",
        "BETTER_AUTH_ISSUER=http://localhost:3000",
        "product-images.jobs.enabled=false"
})
@AutoConfigureMockMvc
class PublicApiDocsTest {

    private static final String API_DOCS = "/api/v3/api-docs";
    private static final String SWAGGER_UI = "/api/swagger-ui/index.html";

    @Autowired MockMvc mvc;

    // Never reach the network from a test.
    @MockitoBean OpenFoodFactsClient openFoodFacts;

    @Test
    void theApiDescriptionIsServedToAnyone() throws Exception {
        mvc.perform(get(API_DOCS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("Disscount API"));
    }

    @Test
    void swaggerUiIsServedToAnyoneUnderApi() throws Exception {
        mvc.perform(get("/api/swagger-ui.html"))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string(HttpHeaders.LOCATION, endsWith(SWAGGER_UI)));
        mvc.perform(get(SWAGGER_UI)).andExpect(status().isOk());
        mvc.perform(get(API_DOCS + "/swagger-config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value(API_DOCS));
    }

    @Test
    void theOldRootPathsAreNoLongerPublic() throws Exception {
        mvc.perform(get("/v3/api-docs")).andExpect(status().isUnauthorized());
        mvc.perform(get("/swagger-ui/index.html")).andExpect(status().isUnauthorized());
    }

    @Test
    void theDescriptionListsOnlyApiRoutesAndNamesNoHost() throws Exception {
        mvc.perform(get(API_DOCS))
                .andExpect(jsonPath("$.paths.keys()", everyItem(startsWith("/api/"))))
                .andExpect(jsonPath("$.paths['/actuator/health']").doesNotExist())
                .andExpect(jsonPath("$.servers[0].url").value("/"))
                .andExpect(jsonPath("$.servers.length()").value(1));
    }

    @Test
    void theDescriptionAsksForWhatTheProxyChecksAndNoBearerToken() throws Exception {
        mvc.perform(get(API_DOCS))
                .andExpect(jsonPath("$.components.securitySchemes.length()").value(3))
                .andExpect(jsonPath("$.components.securitySchemes.webClient.in").value("header"))
                .andExpect(jsonPath("$.components.securitySchemes.webClient.name").value("X-Disscount-Client"))
                .andExpect(jsonPath("$.components.securitySchemes.accountPin.name").value("X-Disscount-User"))
                .andExpect(jsonPath("$.components.securitySchemes.sessionCookie.in").value("cookie"))
                .andExpect(jsonPath("$.components.securitySchemes.sessionCookie.name")
                        .value("__Secure-better-auth.session_token"))
                .andExpect(jsonPath("$.security[0].keys()", containsInAnyOrder(
                        OpenApiConfig.WEB_CLIENT, OpenApiConfig.ACCOUNT_PIN, OpenApiConfig.SESSION_COOKIE)))
                .andExpect(jsonPath("$.security[1].keys()", contains(OpenApiConfig.WEB_CLIENT)));
    }

    @Test
    void readingTheDocsUnlocksNoRoute() throws Exception {
        mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
        mvc.perform(post(API_DOCS)).andExpect(status().isUnauthorized());
    }
}
