package disscount.contactMessage.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import disscount.contactMessage.dto.ContactMessageDto;
import disscount.contactMessage.dto.ContactMessageRequest;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import disscount.user.service.UserService;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(showSql = false)
@Import(ContactMessageService.class)
class ContactMessageServiceTest {

    @Autowired ContactMessageService service;
    @Autowired UserRepository users;
    @MockBean UserService userService;

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
        assertThat(service.create(request()).getUserId()).isEqualTo(user.getId());
    }

    @Test
    void aDeletedAccountIsNotStoredAsTheSender() {
        user.setDeletedAt(LocalDateTime.of(2026, 1, 1, 0, 0));
        users.save(user);

        ContactMessageDto message = service.create(request());

        assertThat(message.getUserId()).isNull();
        assertThat(message.getSubject()).isEqualTo("Pozdrav");
    }

    private static ContactMessageRequest request() {
        ContactMessageRequest request = new ContactMessageRequest();
        request.setSubject("Pozdrav");
        request.setMessage("Poruka");
        return request;
    }
}
