package disscount.contact;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import disscount.shared.NotFoundException;
import disscount.shared.UnauthorizedException;
import disscount.user.ActiveUsers;
import disscount.user.AuthIdentityDao;
import disscount.user.AdminAuditLog;
import disscount.user.User;
import disscount.user.UserRepository;
import disscount.user.UserService;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@DataJpaTest(showSql = false)
@Import({ActiveUsers.class, ContactMessageService.class})
class ContactMessageServiceTest {

    @Autowired ContactMessageService service;
    @Autowired UserRepository users;
    @MockitoBean UserService userService;
    @MockitoBean AuthIdentityDao authIdentities;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean AdminAuditLog adminAudit;

    User user;

    @BeforeEach
    void setUp() {
        user = users.save(User.builder().id(UUID.randomUUID()).username("marko").build());
    }

    @Test
    void aSignedInUserIsStoredAsTheSender() {
        assertThat(service.create(request(), user.getId()).orElseThrow().userId()).isEqualTo(user.getId());
    }

    @Test
    void anAnonymousSenderIsStoredWithoutAnAccount() {
        assertThat(service.create(request(), null).orElseThrow().userId()).isNull();
    }

    // A token outlives its account by minutes, and a message saved then would keep the erased person's details.
    @Test
    void aDeletedAccountCannotSendAMessage() {
        user.setDeletedAt(LocalDateTime.of(2026, 1, 1, 0, 0));
        users.save(user);

        assertThatThrownBy(() -> service.create(request(), user.getId())).isInstanceOf(UnauthorizedException.class);
        assertThat(service.list(true)).isEmpty();
    }

    @Test
    void aSignedOutMessageFromAnErasedAccountsAddressKeepsNoSender() {
        UUID erased = UUID.randomUUID();
        jdbc.update("INSERT INTO app.erasure_ledger (user_id, erased_at, scope) VALUES (?, CURRENT_TIMESTAMP, 'account')", erased);
        when(authIdentities.findIdByEmail("ana@example.com")).thenReturn(Optional.of(erased));

        ContactMessageDto message = service.create(signedOut("ana@example.com"), null).orElseThrow();

        assertThat(message.email()).isNull();
        assertThat(message.fullName()).isNull();
        assertThat(message.message()).isEqualTo("Poruka");
    }

    @Test
    void aSignedOutMessageFromALiveAccountsAddressKeepsItsSender() {
        when(authIdentities.findIdByEmail("marko@example.com")).thenReturn(Optional.of(user.getId()));

        ContactMessageDto message = service.create(signedOut("marko@example.com"), null).orElseThrow();

        assertThat(message.email()).isEqualTo("marko@example.com");
        assertThat(message.fullName()).isEqualTo("Marko");
    }

    @Test
    void aHoneypotSubmissionIsDroppedWithoutAMessage() {
        ContactMessageRequest bot = request("https://spam.example");

        assertThat(service.create(bot, user.getId())).isEmpty();
        assertThat(service.list(true, UUID.randomUUID())).isEmpty();
    }

    @Test
    void aWhitespaceOnlyHoneypotIsDroppedWithoutAMessage() {
        ContactMessageRequest bot = request("   ");

        assertThat(service.create(bot, user.getId())).isEmpty();
        assertThat(service.list(true, UUID.randomUUID())).isEmpty();
    }

    @Test
    void anUnknownMessageIdIsNotFound() {
        UUID unknown = UUID.randomUUID();

        assertThatThrownBy(() -> service.getById(unknown, UUID.randomUUID())).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.markRead(unknown, UUID.randomUUID())).isInstanceOf(NotFoundException.class);
    }

    private static ContactMessageRequest request() {
        return request(null);
    }

    private static ContactMessageRequest signedOut(String email) {
        return new ContactMessageRequest(email, email.startsWith("marko") ? "Marko" : "Ana", "Pozdrav", "Poruka", null, null);
    }

    private static ContactMessageRequest request(String honeypot) {
        return new ContactMessageRequest(null, null, "Pozdrav", "Poruka", null, honeypot);
    }
}
