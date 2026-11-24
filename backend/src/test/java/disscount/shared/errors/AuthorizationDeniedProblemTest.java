package disscount.shared.errors;

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

/** ResponseEntityExceptionHandler does not know method security, so without its own handler a denial is a 500. */
class AuthorizationDeniedProblemTest {

    @RestController
    static class DeniedController {
        @GetMapping("/denied")
        String denied() {
            throw new AuthorizationDeniedException("Access Denied", new AuthorizationDecision(false));
        }
    }

    @Test
    void aMethodSecurityDenialIsTheSame403ProblemAsTheChains() throws Exception {
        ResourceBundleMessageSource messages = new ResourceBundleMessageSource();
        messages.setBasename("messages");
        // Spring reads unset encodings as ISO-8859-1, and the JDK caches the bundle for every later test.
        messages.setDefaultEncoding("UTF-8");
        messages.setFallbackToSystemLocale(false);
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new DeniedController())
                .setControllerAdvice(new GlobalExceptionHandler(messages))
                .build();

        mvc.perform(get("/denied").header(HttpHeaders.ACCEPT_LANGUAGE, "hr"))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("urn:disscount:forbidden"))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.title").value("Nemaš pristup"))
                .andExpect(jsonPath("$.detail").value("Nemaš dopuštenje za ovo."))
                .andExpect(jsonPath("$.instance").value("/denied"))
                .andExpect(jsonPath("$.timestamp").exists());
    }
}
