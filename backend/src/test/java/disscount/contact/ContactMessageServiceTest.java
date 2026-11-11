package disscount.contact;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;

import disscount.shared.NotFoundException;
import disscount.user.ActiveUsers;
import disscount.user.AdminAuditLog;
import disscount.user.User;
import disscount.user.UserRepository;
import disscount.user.UserService;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest(showSql = false)
@Import({ActiveUsers.class, ContactMessageService.class})
class ContactMessageServiceTest {

    @Autowired ContactMessageService service;
    @Autowired UserRepository users;
    @MockitoBean UserService userService;
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

    @Test
    void aDeletedAccountIsNotStoredAsTheSender() {
        user.setDeletedAt(LocalDateTime.of(2026, 1, 1, 0, 0));
        users.save(user);

        ContactMessageDto message = service.create(request(), user.getId()).orElseThrow();

        assertThat(message.userId()).isNull();
        assertThat(message.subject()).isEqualTo("Pozdrav");
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

    private static ContactMessageRequest request(String honeypot) {
        return new ContactMessageRequest(null, null, "Pozdrav", "Poruka", null, honeypot);
    }
}
