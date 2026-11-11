package disscount.contact;

import disscount.support.FullStackTest;
import disscount.support.MigratedPostgres;
import disscount.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** PostgreSQL, so every row passes the migrated action check and the backend login's insert-only grant. */
@MigratedPostgres
class AdminContactAuditTest extends FullStackTest {

    @Autowired ContactMessageRepository messages;
    @Autowired JdbcTemplate jdbc;

    private User admin;

    @BeforeEach
    void setUp() {
        admin = newAdmin();
    }

    private UUID newMessage() {
        return messages.save(ContactMessage.builder().subject("Pitanje").message("Poruka").build()).getId();
    }

    private List<String> actionsOn(UUID messageId) {
        return jdbc.queryForList("""
                SELECT action FROM app.admin_audit
                WHERE actor_user_id = ? AND object_id = ? AND target_user_id IS NULL
                ORDER BY occurred_at, action
                """, String.class, admin.getId(), messageId);
    }

    @Test
    void everyChangeToAMessageWritesARow() throws Exception {
        UUID id = newMessage();

        mvc.perform(patch("/api/admin/contact/{id}/read", id).with(as(admin))).andExpect(status().isOk());
        mvc.perform(patch("/api/admin/contact/{id}/unread", id).with(as(admin))).andExpect(status().isOk());
        mvc.perform(delete("/api/admin/contact/{id}", id).with(as(admin))).andExpect(status().isOk());
        mvc.perform(patch("/api/admin/contact/{id}/restore", id).with(as(admin))).andExpect(status().isOk());

        assertThat(actionsOn(id)).containsExactlyInAnyOrder(
                "MARK_CONTACT_MESSAGE_READ", "MARK_CONTACT_MESSAGE_UNREAD",
                "DELETE_CONTACT_MESSAGE", "RESTORE_CONTACT_MESSAGE");
    }

    @Test
    void openingAMessageTwiceWithinTheWindowWritesOneRow() throws Exception {
        UUID id = newMessage();

        mvc.perform(get("/api/admin/contact/{id}", id).with(as(admin))).andExpect(status().isOk());
        mvc.perform(get("/api/admin/contact/{id}", id).with(as(admin))).andExpect(status().isOk());

        assertThat(actionsOn(id)).containsExactly("READ_CONTACT_MESSAGE");
    }

    @Test
    void listingTheInboxTwiceWithinTheWindowWritesOneRow() throws Exception {
        mvc.perform(get("/api/admin/contact").with(as(admin))).andExpect(status().isOk());
        mvc.perform(get("/api/admin/contact").param("includeDeleted", "true").with(as(admin))).andExpect(status().isOk());

        assertThat(jdbc.queryForList("""
                SELECT action FROM app.admin_audit WHERE actor_user_id = ? AND object_id IS NULL
                """, String.class, admin.getId())).containsExactly("READ_CONTACT_LIST");
    }

    @Test
    void anUnknownMessageWritesNothing() throws Exception {
        UUID unknown = UUID.randomUUID();

        mvc.perform(get("/api/admin/contact/{id}", unknown).with(as(admin))).andExpect(status().isNotFound());
        mvc.perform(patch("/api/admin/contact/{id}/read", unknown).with(as(admin))).andExpect(status().isNotFound());

        assertThat(actionsOn(unknown)).isEmpty();
    }
}
