package disscount.contactMessage.rest;

import disscount.contactMessage.dao.ContactMessageRepository;
import disscount.contactMessage.domain.ContactMessage;
import disscount.support.FullStackTest;
import disscount.user.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.JsonNode;

import java.util.Set;

import static disscount.support.WireFormat.LOCAL_DATE_TIME;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Pins ContactMessageDto against contactMessageDtoSchema, which the admin inbox parses on every read. */
class ContactMessageWireFormatTest extends FullStackTest {

    static final Set<String> MESSAGE_FIELDS = Set.of(
            "id", "userId", "email", "fullName", "subject", "message", "sourcePath",
            "readAt", "createdAt", "updatedAt", "deletedAt");

    @Autowired ContactMessageRepository messages;

    @Test
    void theAdminSeesEveryFieldAndUnsetOnesAsNull() throws Exception {
        User admin = newAdmin();
        ContactMessage saved = messages.save(ContactMessage.builder().subject("Pitanje").message("Poruka").build());

        JsonNode message = body(mvc.perform(get("/api/admin/contact/{id}", saved.getId()).with(as(admin)))
                .andExpect(status().isOk()));

        assertThat(fieldNames(message)).containsExactlyInAnyOrderElementsOf(MESSAGE_FIELDS);
        for (String field : Set.of("userId", "email", "fullName", "sourcePath", "readAt", "deletedAt")) {
            assertThat(message.get(field).isNull()).as(field).isTrue();
        }
        assertThat(message.get("createdAt").asString()).matches(LOCAL_DATE_TIME);
        assertThat(message.get("updatedAt").asString()).matches(LOCAL_DATE_TIME);
    }

    @Test
    void aMutationAndTheListAnswerWithTheSameShape() throws Exception {
        User admin = newAdmin();
        ContactMessage saved = messages.save(ContactMessage.builder().subject("Pitanje").message("Poruka").build());

        JsonNode read = body(mvc.perform(patch("/api/admin/contact/{id}/read", saved.getId()).with(as(admin)))
                .andExpect(status().isOk()));
        assertThat(fieldNames(read)).containsExactlyInAnyOrderElementsOf(MESSAGE_FIELDS);
        assertThat(read.get("readAt").asString()).matches(LOCAL_DATE_TIME);

        JsonNode all = body(mvc.perform(get("/api/admin/contact").with(as(admin))).andExpect(status().isOk()));
        assertThat(all.isArray()).isTrue();
        assertThat(fieldNames(all.get(0))).containsExactlyInAnyOrderElementsOf(MESSAGE_FIELDS);
    }
}
