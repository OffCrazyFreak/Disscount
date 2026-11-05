package disscount.exceptions;

import org.junit.jupiter.api.Test;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The catch-all makes this a 500, as ResponseEntityExceptionHandler lacks it; method security must flip it to 403. */
class AuthorizationDeniedCharacterizationTest {

    @RestController
    static class DeniedController {
        @GetMapping("/denied")
        String denied() {
            throw new AuthorizationDeniedException("Access Denied", new AuthorizationDecision(false));
        }
    }

    @Test
    void aMethodSecurityDenialIsA500Today() throws Exception {
        ResourceBundleMessageSource messages = new ResourceBundleMessageSource();
        messages.setBasename("messages");
        // Spring reads unset encodings as ISO-8859-1, and the JDK caches the bundle for every later test.
        messages.setDefaultEncoding("UTF-8");
        messages.setFallbackToSystemLocale(false);
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new DeniedController())
                .setControllerAdvice(new GlobalExceptionHandler(messages))
                .build();

        mvc.perform(get("/denied").header(HttpHeaders.ACCEPT_LANGUAGE, "hr"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("urn:disscount:internal-error"))
                .andExpect(jsonPath("$.title").value("Nešto je pošlo po krivu"));
    }
}
