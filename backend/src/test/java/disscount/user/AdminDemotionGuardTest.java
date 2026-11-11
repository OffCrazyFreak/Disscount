package disscount.user;

import disscount.shared.ConflictException;
import disscount.support.FullStackTest;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 409, because the refusal comes from the state of the admin set, not from a malformed request. */
class AdminDemotionGuardTest extends FullStackTest {

    private static MockHttpServletRequestBuilder setAccountType(User target, AccountType accountType) {
        return patch("/api/admin/users/" + target.getId())
                .header(HttpHeaders.ACCEPT_LANGUAGE, "hr")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"accountType\":\"" + accountType + "\"}");
    }

    private AccountType storedAccountType(User user) {
        return users.findById(user.getId()).orElseThrow().getAccountType();
    }

    @Test
    void anAdminCannotDemoteThemselves() throws Exception {
        User admin = newAdmin();

        mvc.perform(setAccountType(admin, AccountType.CONSUMER).with(as(admin)))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("urn:disscount:conflict"))
                .andExpect(jsonPath("$.code").value("error.user.cannotDemoteSelf"))
                .andExpect(jsonPath("$.detail").value("Ne možeš sebi oduzeti administratorska prava."));

        assertThat(storedAccountType(admin)).isEqualTo(AccountType.ADMIN);
    }

    @Test
    void anAdminMayKeepTheirOwnAdminType() throws Exception {
        User admin = newAdmin();

        mvc.perform(setAccountType(admin, AccountType.ADMIN).with(as(admin))).andExpect(status().isOk());
    }

    @Test
    void anAdminMayDemoteAnotherAdmin() throws Exception {
        User admin = newAdmin();
        User otherAdmin = newAdmin();

        mvc.perform(setAccountType(otherAdmin, AccountType.CONSUMER).with(as(admin))).andExpect(status().isOk());

        assertThat(storedAccountType(otherAdmin)).isEqualTo(AccountType.CONSUMER);
    }

    // Reachable only when the caller lost admin in the meantime, such as two admins demoting each other at once.
    @Test
    void theLastAdminCannotBeDemoted() {
        UserRepository repository = mock(UserRepository.class);
        UserService service = new UserService(repository, mock(AuthIdentityDao.class), mock(UserProfileCreator.class),
                mock(ApplicationEventPublisher.class), mock(ErasureLedgerRepository.class), mock(AvatarSanitizer.class));
        User lastAdmin = newAdmin();
        User demotedCaller = newUser("demoted");
        when(repository.findById(lastAdmin.getId())).thenReturn(Optional.of(lastAdmin));
        when(repository.lockActiveAdmins()).thenReturn(List.of(lastAdmin));

        assertThatThrownBy(() -> service.updateAccountType(lastAdmin.getId(), AccountType.CONSUMER, demotedCaller.getId()))
                .isInstanceOf(ConflictException.class)
                .hasMessage("error.user.lastAdmin");
        assertThat(lastAdmin.getAccountType()).isEqualTo(AccountType.ADMIN);
    }
}
