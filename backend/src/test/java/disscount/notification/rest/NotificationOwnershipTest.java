package disscount.notification.rest;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;
import disscount.config.SecurityConfig;
import disscount.notification.dao.NotificationRepository;
import disscount.notification.domain.Notification;
import disscount.notification.service.NotificationService;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import disscount.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.AutoConfigureDataJpa;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Real service and H2 repository behind the controller, because the bug lives in the query.
@WebMvcTest(NotificationController.class)
@AutoConfigureDataJpa
@AutoConfigureTestDatabase
@Import({SecurityConfig.class, NotificationService.class})
class NotificationOwnershipTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired NotificationRepository notifications;
    @MockitoBean UserService userService;

    private User alice;
    private Notification bobsNotification;

    @BeforeEach
    void setUp() {
        notifications.deleteAll();
        users.deleteAll();
        alice = users.save(User.builder().id(UUID.randomUUID()).username("alice").build());
        User bob = users.save(User.builder().id(UUID.randomUUID()).username("bob").build());
        bobsNotification = notifications.save(Notification.builder().user(bob).message("Bob's alert").build());
    }

    private RequestPostProcessor as(User user) {
        return jwt().jwt(j -> j.subject(user.getId().toString()));
    }

    @Test
    void anotherUsersNotificationCannotBeMarkedRead() throws Exception {
        mvc.perform(patch("/api/notifications/{id}/read", bobsNotification.getId()).with(as(alice)))
                .andExpect(status().isNotFound());

        assertThat(notifications.findById(bobsNotification.getId()).orElseThrow().getIsRead()).isFalse();
    }

    @Test
    void anotherUsersNotificationCannotBeDeleted() throws Exception {
        mvc.perform(delete("/api/notifications/{id}", bobsNotification.getId()).with(as(alice)))
                .andExpect(status().isNotFound());

        assertThat(notifications.findById(bobsNotification.getId()).orElseThrow().getDeletedAt()).isNull();
    }

    @Test
    void anUnknownIdAnswersLikeAForeignOne() throws Exception {
        assertThat(notFoundBody(patch("/api/notifications/{id}/read", UUID.randomUUID())))
                .isEqualTo(notFoundBody(patch("/api/notifications/{id}/read", bobsNotification.getId())));
        assertThat(notFoundBody(delete("/api/notifications/{id}", UUID.randomUUID())))
                .isEqualTo(notFoundBody(delete("/api/notifications/{id}", bobsNotification.getId())));
    }

    // Timestamp and the echoed request path differ per call by design and reveal nothing about the row.
    private JsonNode notFoundBody(MockHttpServletRequestBuilder request) throws Exception {
        String body = mvc.perform(request.with(as(alice))).andExpect(status().isNotFound())
                .andReturn().getResponse().getContentAsString();
        ObjectNode problem = (ObjectNode) json.readTree(body);
        problem.remove(List.of("timestamp", "instance"));
        return problem;
    }

    @Test
    void theOwnerCanMarkReadAndDelete() throws Exception {
        Notification own = notifications.save(Notification.builder().user(alice).message("Alice's alert").build());

        mvc.perform(patch("/api/notifications/{id}/read", own.getId()).with(as(alice)))
                .andExpect(status().isNoContent());
        assertThat(notifications.findById(own.getId()).orElseThrow().getIsRead()).isTrue();

        mvc.perform(delete("/api/notifications/{id}", own.getId()).with(as(alice)))
                .andExpect(status().isNoContent());
        assertThat(notifications.findById(own.getId()).orElseThrow().getDeletedAt()).isNotNull();
    }

    @Test
    void requestsWithoutATokenAre401() throws Exception {
        mvc.perform(patch("/api/notifications/{id}/read", bobsNotification.getId())).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/notifications/{id}", bobsNotification.getId())).andExpect(status().isUnauthorized());
    }
}
