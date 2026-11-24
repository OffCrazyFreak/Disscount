package disscount.security;

import disscount.support.FullStackTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.JsonNode;

import java.util.Set;

import static disscount.support.WireFormat.INSTANT;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Pins the security chain's own 401 and 403 bodies, which lib/api/problem-details.ts parses like any problem. */
class SecurityProblemWireFormatTest extends FullStackTest {

    private static final Set<String> PROBLEM_FIELDS = Set.of("type", "title", "status", "detail", "instance", "timestamp");

    private JsonNode problem(ResultActions result, int status, String type) throws Exception {
        JsonNode body = body(result
                .andExpect(status().is(status))
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON)));

        assertThat(fieldNames(body)).isEqualTo(PROBLEM_FIELDS);
        assertThat(body.get("type").asString()).isEqualTo("urn:disscount:" + type);
        assertThat(body.get("status").asInt()).isEqualTo(status);
        assertThat(body.get("timestamp").asString()).matches(INSTANT);
        return body;
    }

    @Test
    void anAnonymousCallerGetsA401Problem() throws Exception {
        JsonNode body = problem(mvc.perform(get("/api/users/me").header(HttpHeaders.ACCEPT_LANGUAGE, "hr"))
                .andExpect(header().doesNotExist(HttpHeaders.WWW_AUTHENTICATE)), 401, "unauthorized");

        assertThat(body.get("title").asString()).isEqualTo("Prijavi se za nastavak");
        assertThat(body.get("detail").asString()).isEqualTo("Za ovo se trebaš prijaviti.");
        assertThat(body.get("instance").asString()).isEqualTo("/api/users/me");
    }

    @Test
    void aTokenThatFailsToDecodeGetsA401ProblemNamingItInTheHeader() throws Exception {
        problem(mvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
                .andExpect(header().string(HttpHeaders.WWW_AUTHENTICATE, startsWith("Bearer error=\"invalid_token\""))),
                401, "unauthorized");
    }

    @Test
    void aConsumerOnAnAdminRouteGetsA403Problem() throws Exception {
        JsonNode body = problem(mvc.perform(get("/api/admin/users")
                .with(as(newUser("consumer")))
                .header(HttpHeaders.ACCEPT_LANGUAGE, "en")), 403, "forbidden");

        assertThat(body.get("title").asString()).isEqualTo("You don't have access");
        assertThat(body.get("detail").asString()).isEqualTo("You don't have permission for this.");
        assertThat(body.get("instance").asString()).isEqualTo("/api/admin/users");
    }

    @Test
    void aSessionTokenOnTheErasureRouteGetsA403Problem() throws Exception {
        problem(mvc.perform(delete("/api/users/me").with(as(newUser("session")))), 403, "forbidden");
    }

    @Test
    void aPurposeScopedTokenOnAnOrdinaryRouteGetsA403Problem() throws Exception {
        problem(mvc.perform(get("/api/users/me").with(jwt().jwt(token -> token
                .subject(newUser("erasing").getId().toString())
                .claim(TokenPurpose.CLAIM, TokenPurpose.ACCOUNT_ERASURE)))), 403, "forbidden");
    }
}
