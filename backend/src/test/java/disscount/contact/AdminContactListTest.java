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
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The list once stopped at the newest 500, which hid older messages from the admin (#55). */
@MigratedPostgres
class AdminContactListTest extends FullStackTest {

    // One of them is deleted, so the plain list too holds more than the old cap of 500.
    private static final int SENT = 502;

    // Later than any message another test leaves behind, so these lead the list.
    private static final LocalDateTime FAR_FUTURE = LocalDateTime.of(2100, 1, 1, 12, 0);

    @Autowired JdbcTemplate jdbc;

    private User admin;
    private final List<UUID> sent = new ArrayList<>();
    private UUID deleted;

    @BeforeEach
    void setUp() {
        admin = newAdmin();

        // Pairs share an instant, so only the id keeps their order stable.
        List<Object[]> rows = new ArrayList<>();
        for (int i = 0; i < SENT; i++) {
            UUID id = UUID.randomUUID();
            LocalDateTime sentAt = FAR_FUTURE.minusMinutes(i / 2);
            rows.add(new Object[] {id, sentAt, sentAt});
            sent.add(id);
        }
        jdbc.batchUpdate("""
                INSERT INTO app.contact_message (id, created_at, updated_at, subject, message)
                VALUES (?, ?, ?, 'Pitanje', 'Poruka')
                """, rows);

        deleted = sent.get(SENT - 1);
        jdbc.update("UPDATE app.contact_message SET deleted_at = ? WHERE id = ?", FAR_FUTURE, deleted);
    }

    @AfterEach
    void removeThisTestsMessages() {
        jdbc.batchUpdate("DELETE FROM app.contact_message WHERE id = ?",
                sent.stream().map(id -> new Object[] {id}).toList());
    }

    @Test
    void everyKeptMessageComesBackNewestFirst() throws Exception {
        List<UUID> kept = sent.subList(0, SENT - 1);

        assertThat(thisTestsMessages(false)).containsExactlyElementsOf(newestFirst(kept));
    }

    @Test
    void everyMessageComesBackWithTheDeletedOnes() throws Exception {
        assertThat(thisTestsMessages(true)).containsExactlyElementsOf(newestFirst(sent));
    }

    // Postgres compares uuids byte by byte, which is the order of their lowercase text.
    private List<UUID> newestFirst(List<UUID> ids) {
        Comparator<UUID> byPosition = Comparator.comparingInt(id -> sent.indexOf(id) / 2);
        Comparator<UUID> byIdDescending = Comparator.comparing(UUID::toString, Comparator.reverseOrder());

        return ids.stream().sorted(byPosition.thenComparing(byIdDescending)).toList();
    }

    private List<UUID> thisTestsMessages(boolean includeDeleted) throws Exception {
        JsonNode list = body(mvc.perform(get("/api/admin/contact")
                        .param("includeDeleted", String.valueOf(includeDeleted))
                        .with(as(admin)))
                .andExpect(status().isOk()));

        List<UUID> found = new ArrayList<>();
        for (JsonNode item : list) {
            UUID id = UUID.fromString(item.get("id").asString());
            if (sent.contains(id)) {
                found.add(id);
            }
        }

        return found;
    }
}
