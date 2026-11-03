package disscount.watchlistItem.rest;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;
import disscount.config.SecurityConfig;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import disscount.user.service.UserService;
import disscount.watchlistItem.dao.WatchlistItemRepository;
import disscount.watchlistItem.domain.WatchType;
import disscount.watchlistItem.domain.WatchlistItem;
import disscount.watchlistItem.service.WatchlistItemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.data.jpa.test.autoconfigure.AutoConfigureDataJpa;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Real service and H2 repository behind the controller, because the bug lives in the query.
@WebMvcTest(WatchlistItemController.class)
@AutoConfigureDataJpa
@AutoConfigureTestDatabase
@Import({SecurityConfig.class, WatchlistItemService.class})
class WatchlistItemOwnershipTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired WatchlistItemRepository watchlist;
    @MockitoBean UserService userService;

    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        watchlist.deleteAll();
        users.deleteAll();
        alice = users.save(User.builder().id(UUID.randomUUID()).username("alice").build());
        bob = users.save(User.builder().id(UUID.randomUUID()).username("bob").build());
    }

    private WatchlistItem itemOf(User user) {
        return watchlist.save(WatchlistItem.builder()
                .user(user).productApiId("3850123456789").watchType(WatchType.PERCENTAGE).thresholdValue(10.0).build());
    }

    private RequestPostProcessor as(User user) {
        return jwt().jwt(j -> j.subject(user.getId().toString()));
    }

    @Test
    void anotherUsersItemCannotBeRemoved() throws Exception {
        WatchlistItem bobsItem = itemOf(bob);

        mvc.perform(delete("/api/watchlist/{id}", bobsItem.getId()).with(as(alice)))
                .andExpect(status().isNotFound());

        assertThat(watchlist.findById(bobsItem.getId()).orElseThrow().getDeletedAt()).isNull();
    }

    @Test
    void anUnknownIdAnswersLikeAForeignOne() throws Exception {
        assertThat(notFoundBody(UUID.randomUUID())).isEqualTo(notFoundBody(itemOf(bob).getId()));
    }

    // Timestamp and the echoed request path differ per call by design and reveal nothing about the row.
    private JsonNode notFoundBody(UUID id) throws Exception {
        String body = mvc.perform(delete("/api/watchlist/{id}", id).with(as(alice))).andExpect(status().isNotFound())
                .andReturn().getResponse().getContentAsString();
        ObjectNode problem = (ObjectNode) json.readTree(body);
        problem.remove(List.of("timestamp", "instance"));
        return problem;
    }

    @Test
    void theOwnerCanRemoveTheirItemAndARepeatStaysA204() throws Exception {
        WatchlistItem own = itemOf(alice);

        mvc.perform(delete("/api/watchlist/{id}", own.getId()).with(as(alice))).andExpect(status().isNoContent());
        var deletedAt = watchlist.findById(own.getId()).orElseThrow().getDeletedAt();
        assertThat(deletedAt).isNotNull();

        mvc.perform(delete("/api/watchlist/{id}", own.getId()).with(as(alice))).andExpect(status().isNoContent());
        assertThat(watchlist.findById(own.getId()).orElseThrow().getDeletedAt()).isEqualTo(deletedAt);
    }

    @Test
    void theListsNeverReturnAnotherUsersItems() throws Exception {
        itemOf(bob);
        WatchlistItem own = itemOf(alice);

        assertThat(idsIn(mvc.perform(get("/api/watchlist/me").with(as(alice)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()))
                .containsExactly(own.getId().toString());
        assertThat(idsIn(mvc.perform(get("/api/watchlist/product/{productApiId}", "3850123456789").with(as(alice)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()))
                .containsExactly(own.getId().toString());
    }

    private List<String> idsIn(String body) {
        return json.readTree(body).valueStream().map(item -> item.get("id").asString()).toList();
    }

    @Test
    void requestsWithoutATokenAre401() throws Exception {
        mvc.perform(delete("/api/watchlist/{id}", itemOf(bob).getId())).andExpect(status().isUnauthorized());
    }
}
