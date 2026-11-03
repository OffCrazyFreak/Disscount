package disscount.user.rest;

import disscount.config.SecurityConfig;
import disscount.user.service.AccountErasureService;
import disscount.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
class UserControllerErasureTokenTest {

    @Autowired MockMvc mvc;
    @MockBean UserService userService;
    @MockBean AccountErasureService accountErasureService;

    private final UUID userId = UUID.randomUUID();

    @Test
    void anOrdinarySessionTokenCannotEraseTheProfile() throws Exception {
        mvc.perform(delete("/api/users/me").with(jwt().jwt(j -> j.subject(userId.toString()))))
                .andExpect(status().isForbidden());

        verify(accountErasureService, never()).erase(any());
    }

    @Test
    void aTokenForAnotherPurposeCannotEraseTheProfile() throws Exception {
        mvc.perform(delete("/api/users/me").with(jwt().jwt(j -> j.subject(userId.toString())
                        .claim("purpose", "something-else"))))
                .andExpect(status().isForbidden());

        verify(accountErasureService, never()).erase(any());
    }

    @Test
    void theAccountErasureTokenErasesItsOwnSubject() throws Exception {
        mvc.perform(delete("/api/users/me").with(jwt().jwt(j -> j.subject(userId.toString())
                        .claim("purpose", "account-erasure"))))
                .andExpect(status().isOk());

        verify(accountErasureService).erase(userId);
    }

    @Test
    void theAccountErasureTokenIsRefusedEverywhereElse() throws Exception {
        mvc.perform(get("/api/users/me").with(jwt().jwt(j -> j.subject(userId.toString())
                        .claim("purpose", "account-erasure"))))
                .andExpect(status().isForbidden());

        verify(userService, never()).findById(any());
    }

    // Security answers before routing, so the contact controller need not be in this slice.
    @Test
    void theAccountErasureTokenIsRefusedOnPublicRoutesToo() throws Exception {
        mvc.perform(post("/api/contact").with(jwt().jwt(j -> j.subject(userId.toString())
                        .claim("purpose", "account-erasure"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void theAccountErasureTokenNeverProvisionsAProfile() throws Exception {
        mvc.perform(delete("/api/users/me").with(jwt().jwt(j -> j.subject(userId.toString())
                        .claim("email", "a@example.com").claim("purpose", "account-erasure"))))
                .andExpect(status().isOk());

        verify(userService, never()).ensureActiveProfile(any(), any(), any(), any());
    }

    @Test
    void anOrdinarySessionTokenStillReadsTheProfile() throws Exception {
        mvc.perform(get("/api/users/me").with(jwt().jwt(j -> j.subject(userId.toString()))))
                .andExpect(status().isNotFound());

        verify(userService).findById(userId);
    }

    @Test
    void anAnonymousCallerIsRejected() throws Exception {
        mvc.perform(delete("/api/users/me")).andExpect(status().isUnauthorized());

        verify(accountErasureService, never()).erase(any());
    }
}
