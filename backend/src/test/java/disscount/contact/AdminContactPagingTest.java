package disscount.contact;

import disscount.support.FullStackTest;
import disscount.support.MigratedPostgres;
import disscount.user.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The inbox loads page after page as the admin scrolls, so no page may repeat or skip a message. */
@MigratedPostgres
class AdminContactPagingTest extends FullStackTest {

    // Later than any message an earlier test left behind, so this test's messages fill the first pages.
    private static final LocalDateTime FAR_FUTURE = LocalDateTime.of(2100, 1, 1, 12, 0);

    private static int testsRun;

    private static final int PAGE_SIZE = 2;

    @Autowired ContactMessageRepository messages;
    @Autowired JdbcTemplate jdbc;

    private User admin;
    private List<UUID> sent;
    private UUID deleted;

    @BeforeEach
    void setUp() throws Exception {
        admin = newAdmin();
        LocalDateTime base = FAR_FUTURE.plusDays(testsRun++);

        // Three share one instant, so only the id can keep their order stable between pages.
        sent = List.of(
                newMessageAt(base.plusMinutes(2)),
                newMessageAt(base.plusMinutes(1)),
                newMessageAt(base),
                newMessageAt(base),
                newMessageAt(base));

        deleted = sent.get(1);
        mvc.perform(delete("/api/admin/contact/{id}", deleted).with(as(admin))).andExpect(status().isOk());
    }

    // Removed again, so a later test's newest page holds its own messages, not these.
    @AfterEach
    void removeThisTestsMessages() {
        sent.forEach(id -> jdbc.update("DELETE FROM app.contact_message WHERE id = ?", id));
    }

    @Test
    void pagesWalkEveryKeptMessageOnceNewestFirst() throws Exception {
        List<UUID> walked = walkThisTestsMessages(false);

        assertThat(walked).doesNotHaveDuplicates().hasSize(sent.size() - 1).doesNotContain(deleted);
        assertThat(walked.subList(0, 1)).containsExactly(sent.get(0));
        assertThat(walked.subList(1, 4)).containsExactlyInAnyOrderElementsOf(sent.subList(2, 5));
    }

    @Test
    void pagesWithDeletedMessagesWalkEveryMessageOnceNewestFirst() throws Exception {
        List<UUID> walked = walkThisTestsMessages(true);

        assertThat(walked).doesNotHaveDuplicates().hasSize(sent.size());
        assertThat(walked.subList(0, 2)).containsExactly(sent.get(0), deleted);
        assertThat(walked.subList(2, 5)).containsExactlyInAnyOrderElementsOf(sent.subList(2, 5));
    }

    @Test
    void aPageAnswersWithItsPositionAndTotals() throws Exception {
        JsonNode first = page(0, PAGE_SIZE, true);

        assertThat(first.at("/page/number").asInt()).isZero();
        assertThat(first.at("/page/size").asInt()).isEqualTo(PAGE_SIZE);
        assertThat(first.at("/page/totalItems").asLong()).isGreaterThanOrEqualTo(sent.size());
        assertThat(first.at("/page/totalPages").asInt()).isGreaterThanOrEqualTo(3);
        assertThat(first.get("items")).hasSize(PAGE_SIZE);
    }

    @Test
    void aRequestForMoreThanOneHundredGetsOneHundred() throws Exception {
        assertThat(page(0, 500, false).at("/page/size").asInt()).isEqualTo(100);
    }

    @Test
    void aConsumerCannotReadAPage() throws Exception {
        mvc.perform(get("/api/admin/contact")
                        .param("page", "1")
                        .param("size", String.valueOf(PAGE_SIZE))
                        .param("includeDeleted", "true")
                        .with(as(newUser("consumer"))))
                .andExpect(status().isForbidden());
    }

    private UUID newMessageAt(LocalDateTime createdAt) {
        UUID id = messages.save(ContactMessage.builder().subject("Pitanje").message("Poruka").build()).getId();
        jdbc.update("UPDATE app.contact_message SET created_at = ? WHERE id = ?", createdAt, id);
        return id;
    }

    private JsonNode page(int number, int size, boolean includeDeleted) throws Exception {
        return body(mvc.perform(get("/api/admin/contact")
                        .param("page", String.valueOf(number))
                        .param("size", String.valueOf(size))
                        .param("includeDeleted", String.valueOf(includeDeleted))
                        .with(as(admin)))
                .andExpect(status().isOk()));
    }

    private List<UUID> walkThisTestsMessages(boolean includeDeleted) throws Exception {
        List<UUID> walked = new ArrayList<>();

        for (int number = 0; number < 3; number++) {
            for (JsonNode item : page(number, PAGE_SIZE, includeDeleted).get("items")) {
                UUID id = UUID.fromString(item.get("id").asString());
                if (sent.contains(id)) {
                    walked.add(id);
                }
            }
        }

        return walked;
    }
}
