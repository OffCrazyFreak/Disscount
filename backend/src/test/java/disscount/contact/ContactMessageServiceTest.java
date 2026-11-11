package disscount.contact;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import disscount.shared.NotFoundException;
import disscount.user.User;
import disscount.user.UserRepository;
import disscount.user.UserService;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest(showSql = false)
@Import(ContactMessageService.class)
class ContactMessageServiceTest {

    @Autowired ContactMessageService service;
    @Autowired UserRepository users;
    @MockitoBean UserService userService;

    User user;

    @BeforeEach
    void setUp() {
        user = users.save(User.builder().id(UUID.randomUUID()).username("marko").build());
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken(user.getId().toString(), null));
    }

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void aSignedInUserIsStoredAsTheSender() {
        assertThat(service.create(request()).orElseThrow().getUserId()).isEqualTo(user.getId());
    }

    @Test
    void aDeletedAccountIsNotStoredAsTheSender() {
        user.setDeletedAt(LocalDateTime.of(2026, 1, 1, 0, 0));
        users.save(user);

        ContactMessageDto message = service.create(request()).orElseThrow();

        assertThat(message.getUserId()).isNull();
        assertThat(message.getSubject()).isEqualTo("Pozdrav");
    }

    @Test
    void aHoneypotSubmissionIsDroppedWithoutAMessage() {
        ContactMessageRequest bot = request();
        bot.setHoneypot("https://spam.example");

        assertThat(service.create(bot)).isEmpty();
        assertThat(service.list(true)).isEmpty();
    }

    @Test
    void aWhitespaceOnlyHoneypotIsDroppedWithoutAMessage() {
        ContactMessageRequest bot = request();
        bot.setHoneypot("   ");

        assertThat(service.create(bot)).isEmpty();
        assertThat(service.list(true)).isEmpty();
    }

    @Test
    void anUnknownMessageIdIsNotFound() {
        UUID unknown = UUID.randomUUID();

        assertThatThrownBy(() -> service.getById(unknown)).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.markRead(unknown)).isInstanceOf(NotFoundException.class);
    }

    private static ContactMessageRequest request() {
        ContactMessageRequest request = new ContactMessageRequest();
        request.setSubject("Pozdrav");
        request.setMessage("Poruka");
        return request;
    }
}
