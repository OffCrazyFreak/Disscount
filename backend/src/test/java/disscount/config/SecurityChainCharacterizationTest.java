package disscount.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** So an upgrade changing path matching or filter order fails here; a 404 means past security, a 401 means not. */
@SpringBootTest
@AutoConfigureMockMvc
class SecurityChainCharacterizationTest {

    private static final String UNKNOWN_LIST = "/api/shopping-lists/" + UUID.randomUUID();

    @Autowired MockMvc mvc;

    @Test
    void anAnonymousCallerReachesAListById() throws Exception {
        mvc.perform(get(UNKNOWN_LIST)).andExpect(status().isNotFound());
        mvc.perform(head(UNKNOWN_LIST)).andExpect(status().isNotFound());
    }

    @Test
    void anUpperCaseUuidStillCountsAsAListId() throws Exception {
        mvc.perform(get(UNKNOWN_LIST.toUpperCase().replace("/API/SHOPPING-LISTS/", "/api/shopping-lists/")))
                .andExpect(status().isNotFound());
    }

    @Test
    void aBrokenTokenOnAListByIdDegradesToAnonymous() throws Exception {
        mvc.perform(get(UNKNOWN_LIST).header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
                .andExpect(status().isNotFound());
        mvc.perform(get(UNKNOWN_LIST).header(HttpHeaders.AUTHORIZATION, "bearer not-a-jwt"))
                .andExpect(status().isNotFound());
    }

    @Test
    void literalAndMalformedListPathsNeedALogin() throws Exception {
        mvc.perform(get("/api/shopping-lists/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/shopping-lists/items")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/shopping-lists/" + UUID.randomUUID().toString().replace("-", "")))
                .andExpect(status().isUnauthorized());
        mvc.perform(get(UNKNOWN_LIST + "/")).andExpect(status().isUnauthorized());
        mvc.perform(get(UNKNOWN_LIST + "/items")).andExpect(status().isUnauthorized());
    }

    @Test
    void anUnlistedMethodOnAListByIdNeedsALogin() throws Exception {
        mvc.perform(patch(UNKNOWN_LIST).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void aBrokenTokenIsRejectedOnTheMainChainEvenForPublicRoutes() throws Exception {
        mvc.perform(post("/api/contact")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"subject\":\"Pozdrav\",\"message\":\"Poruka\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void publicRoutesNeedNoLogin() throws Exception {
        mvc.perform(get("/api/products/3850000000000/images")).andExpect(status().isOk());
        mvc.perform(get("/api/products/images/thumbnails").param("eans", "3850000000000"))
                .andExpect(status().isOk());
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.components").doesNotExist());
    }

    @Test
    void everythingElseNeedsALogin() throws Exception {
        mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/contact")).andExpect(status().isUnauthorized());
        mvc.perform(get("/actuator/info")).andExpect(status().isUnauthorized());
    }

    @Test
    void anUnknownPathIs404ForASignedInCaller() throws Exception {
        mvc.perform(get("/api/does-not-exist").with(jwt()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("urn:disscount:not-found"));
    }

    @Test
    void swaggerUiAndTheSpecAreServedAnonymously() throws Exception {
        mvc.perform(get("/api-docs"))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string(HttpHeaders.LOCATION, containsString("/swagger-ui/index.html")));
        mvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk());
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("Disscount API"))
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.scheme").value("bearer"))
                .andExpect(jsonPath("$.paths['/api/shopping-lists/{id}'].get").exists());
    }

    // No CORS is configured: the browser only ever calls the API through the Next.js server.
    @Test
    void crossOriginCallsGetNoCorsHeaders() throws Exception {
        mvc.perform(options("/api/users/me")
                        .header(HttpHeaders.ORIGIN, "https://elsewhere.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
        mvc.perform(get("/api/products/3850000000000/images").header(HttpHeaders.ORIGIN, "https://elsewhere.example"))
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }
}
