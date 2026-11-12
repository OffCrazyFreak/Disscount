package disscount.contact;

import disscount.support.FullStackTest;
import disscount.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** @SQLRestriction hides deleted messages from JPA, yet the admin lists, opens and restores them. */
class AdminContactSoftDeleteTest extends FullStackTest {

    @Autowired ContactMessageRepository messages;

    private User admin;

    @BeforeEach
    void setUp() {
        admin = newAdmin();
    }

    private UUID newMessage() {
        return messages.save(ContactMessage.builder().subject("Pitanje").message("Poruka").build()).getId();
    }

    @Test
    void aDeletedMessageIsListedOnlyWhenAsked() throws Exception {
        UUID kept = newMessage();
        UUID deleted = newMessage();

        mvc.perform(delete("/api/admin/contact/{id}", deleted).with(as(admin))).andExpect(status().isOk());

        mvc.perform(get("/api/admin/contact").with(as(admin)))
                .andExpect(jsonPath("$.items[?(@.id == '%s')]", kept).exists())
                .andExpect(jsonPath("$.items[?(@.id == '%s')]", deleted).doesNotExist());
        mvc.perform(get("/api/admin/contact").param("includeDeleted", "true").with(as(admin)))
                .andExpect(jsonPath("$.items[?(@.id == '%s')]", kept).exists())
                .andExpect(jsonPath("$.items[?(@.id == '%s')].deletedAt", deleted).isNotEmpty());
    }

    @Test
    void aDeletedMessageCanStillBeOpenedMarkedAndRestored() throws Exception {
        UUID id = newMessage();
        mvc.perform(delete("/api/admin/contact/{id}", id).with(as(admin))).andExpect(status().isOk());

        mvc.perform(get("/api/admin/contact/{id}", id).with(as(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deletedAt").isNotEmpty());
        mvc.perform(patch("/api/admin/contact/{id}/read", id).with(as(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.readAt").isNotEmpty());
        mvc.perform(delete("/api/admin/contact/{id}", id).with(as(admin))).andExpect(status().isOk());

        mvc.perform(patch("/api/admin/contact/{id}/restore", id).with(as(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deletedAt").isEmpty());
        mvc.perform(get("/api/admin/contact").with(as(admin)))
                .andExpect(jsonPath("$.items[?(@.id == '%s')]", id).exists());
    }
}
