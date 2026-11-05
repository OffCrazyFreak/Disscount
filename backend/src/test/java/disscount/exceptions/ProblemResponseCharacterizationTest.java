package disscount.exceptions;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.aMapWithSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
        mvc.perform(delete("/api/watchlist/not-a-uuid").with(jwt()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("urn:disscount:bad-request"));
    }

    @Test
    void aWrongMethodOnAKnownRouteIsA405ListingTheAllowedOnes() throws Exception {
        mvc.perform(get("/api/contact").with(jwt()))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(header().string(HttpHeaders.ALLOW, "POST"))
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("urn:disscount:method-not-allowed"))
                .andExpect(jsonPath("$.title").value("Metoda nije dopuštena"))
                .andExpect(jsonPath("$.detail").value("Metoda GET nije podržana za ovu adresu."));
    }

    @Test
    void anUnsupportedContentTypeIsA415ListingTheAcceptedOnes() throws Exception {
        mvc.perform(post("/api/contact").with(jwt()).contentType(MediaType.TEXT_PLAIN).content("hi"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(header().exists(HttpHeaders.ACCEPT))
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("urn:disscount:unsupported-media-type"))
                .andExpect(jsonPath("$.title").value("Format nije podržan"))
                .andExpect(jsonPath("$.detail").value("Ovaj format sadržaja nije podržan."));
    }

    @Test
    void aMissingRequiredQueryParameterIsA400NamingIt() throws Exception {
        mvc.perform(get("/api/products/images/thumbnails"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("urn:disscount:bad-request"))
                .andExpect(jsonPath("$.title").value("Neispravan zahtjev"))
                .andExpect(jsonPath("$.detail").value("Nedostaje parametar: eans"));
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
