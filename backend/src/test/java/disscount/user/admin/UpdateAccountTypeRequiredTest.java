package disscount.user.admin;

import disscount.support.FullStackTest;
import disscount.user.User;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The account type is required in the contract, so a missing one fails validation like any other required field. */
class UpdateAccountTypeRequiredTest extends FullStackTest {

    @Test
    void aBodyWithoutAnAccountTypeIsAValidationError() throws Exception {
        User admin = newAdmin();
        User target = newUser("petra");

        mvc.perform(patch("/api/admin/users/{id}", target.getId()).with(as(admin))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("urn:disscount:validation"))
                .andExpect(jsonPath("$.fieldErrors.accountType").exists());
    }
}
