package disscount.exceptions;

import org.junit.jupiter.api.Test;
import org.springframework.context.support.ResourceBundleMessageSource;
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

/**
 * Pins today's answer when method security denies a call: the catch-all turns it into a 500,
 * because ResponseEntityExceptionHandler does not know the exception. Nothing in main throws it
 * yet; the method security PR must map it to 403 first and then flip this test.
 */
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
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new DeniedController())
                .setControllerAdvice(new GlobalExceptionHandler(messages))
                .build();

        mvc.perform(get("/denied"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("urn:disscount:internal-error"));
    }
}
