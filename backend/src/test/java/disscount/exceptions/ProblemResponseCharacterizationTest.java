package disscount.exceptions;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.aMapWithSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Pins the problem+json shape the frontend parses, so a framework upgrade cannot reshape it. */
@SpringBootTest
@AutoConfigureMockMvc
class ProblemResponseCharacterizationTest {

    private static final String ISO_INSTANT = "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z";

    @Autowired MockMvc mvc;

    @Test
    void aRequestBodyFailingValidationListsEachField() throws Exception {
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("urn:disscount:validation"))
                .andExpect(jsonPath("$.title").value("Provjeri unesene podatke"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail").value("Provjeri unesene podatke."))
                .andExpect(jsonPath("$.instance").value("/api/contact"))
                .andExpect(jsonPath("$.timestamp").value(matchesPattern(ISO_INSTANT)))
                .andExpect(jsonPath("$.fieldErrors", aMapWithSize(2)))
                .andExpect(jsonPath("$.fieldErrors.subject").value("Upiši naslov."))
                .andExpect(jsonPath("$.fieldErrors.message").value("Upiši poruku."));
    }

    @Test
    void validationMessagesFollowAcceptLanguage() throws Exception {
        mvc.perform(post("/api/contact")
                        .header(HttpHeaders.ACCEPT_LANGUAGE, "en")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.subject").value("Enter a subject."));
    }

    @Test
    void malformedJsonIsA400WithoutFieldErrors() throws Exception {
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("urn:disscount:malformed-request"))
                .andExpect(jsonPath("$.fieldErrors").doesNotExist());
    }

    @Test
    void aMalformedUuidInThePathIsA400() throws Exception {
        mvc.perform(patch("/api/notifications/not-a-uuid/read").with(jwt()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("urn:disscount:bad-request"));
    }

    @Test
    void aListParameterFailingValidationIsKeyedByMethodAndParameter() throws Exception {
        mvc.perform(post("/api/digital-cards/used").with(jwt()).contentType(MediaType.APPLICATION_JSON).content("[]"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("urn:disscount:validation"))
                .andExpect(jsonPath("$.fieldErrors", aMapWithSize(1)))
                .andExpect(jsonPath("$.fieldErrors['recordUsed.entries']").value("Pošalji od 1 do 50 kartica odjednom"));
    }
}
