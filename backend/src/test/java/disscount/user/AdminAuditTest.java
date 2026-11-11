package disscount.user;

import disscount.shared.ConflictException;
import disscount.support.FullStackTest;
import disscount.support.MigratedPostgres;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** PostgreSQL, so the rows go through the migrated table and its check, and erasure runs its real listeners. */
@MigratedPostgres
class AdminAuditTest extends FullStackTest {

    @Autowired AdminAuditRepository adminAudit;
    @Autowired AccountErasureService accountErasure;
    @Autowired UserService userService;
    @Autowired JdbcTemplate jdbc;

    private static MockHttpServletRequestBuilder setAccountType(User target, AccountType accountType) {
        return patch("/api/admin/users/{id}", target.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"accountType\":\"" + accountType + "\"}");
    }

    private static MockHttpServletRequestBuilder deleteUser(UUID targetId) {
        return delete("/api/admin/users/{id}", targetId);
    }

    private List<AdminAuditEntry> auditOf(User target) {
        return adminAudit.findByTargetUserIdOrderByOccurredAtAsc(target.getId());
    }

    private static void assertSingleEntry(List<AdminAuditEntry> entries, User admin, User target, AdminAction action) {
        assertThat(entries).singleElement().satisfies(entry -> {
            assertThat(entry.getActorUserId()).isEqualTo(admin.getId());
            assertThat(entry.getTargetUserId()).isEqualTo(target.getId());
            assertThat(entry.getAction()).isEqualTo(action);
            assertThat(entry.getOccurredAt()).isNotNull();
        });
    }

    @Test
    void deletingAUserWritesOneRow() throws Exception {
        User admin = newAdmin();
        User target = newUser("target");

        mvc.perform(deleteUser(target.getId()).with(as(admin))).andExpect(status().isOk());

        assertSingleEntry(auditOf(target), admin, target, AdminAction.DELETE_USER);
    }

    @Test
    void promotingAUserWritesOneRow() throws Exception {
        User admin = newAdmin();
        User target = newUser("target");

        mvc.perform(setAccountType(target, AccountType.ADMIN).with(as(admin))).andExpect(status().isOk());

        assertSingleEntry(auditOf(target), admin, target, AdminAction.PROMOTE_TO_ADMIN);
    }

    @Test
    void demotingAnAdminWritesOneRow() throws Exception {
        User admin = newAdmin();
        User target = newAdmin();

        mvc.perform(setAccountType(target, AccountType.CONSUMER).with(as(admin))).andExpect(status().isOk());

        assertSingleEntry(auditOf(target), admin, target, AdminAction.DEMOTE_FROM_ADMIN);
    }

    @Test
    void aTypeChangeThatNeitherGrantsNorRemovesAdminWritesNothing() throws Exception {
        User admin = newAdmin();
        User consumer = newUser("consumer");
        User otherAdmin = newAdmin();

        mvc.perform(setAccountType(consumer, AccountType.ENTERPRISE).with(as(admin))).andExpect(status().isOk());
        mvc.perform(setAccountType(otherAdmin, AccountType.ADMIN).with(as(admin))).andExpect(status().isOk());

        assertThat(auditOf(consumer)).isEmpty();
        assertThat(auditOf(otherAdmin)).isEmpty();
    }

    @Test
    void refusedActionsWriteNothing() throws Exception {
        User admin = newAdmin();
        User consumer = newUser("consumer");
        UUID unknownId = UUID.randomUUID();
        long rowsBefore = auditRowCount();

        mvc.perform(deleteUser(consumer.getId()).with(as(consumer))).andExpect(status().isForbidden());
        mvc.perform(setAccountType(consumer, AccountType.ADMIN).with(as(consumer))).andExpect(status().isForbidden());
        mvc.perform(deleteUser(admin.getId()).with(as(admin))).andExpect(status().isBadRequest());
        mvc.perform(setAccountType(admin, AccountType.CONSUMER).with(as(admin))).andExpect(status().isConflict());
        mvc.perform(deleteUser(unknownId).with(as(admin))).andExpect(status().isBadRequest());

        assertThat(auditRowCount()).isEqualTo(rowsBefore);
    }

    // Through the service, as the API only reaches these guards when another admin is the caller.
    @Test
    void theLastAdminGuardsWriteNothing() {
        jdbc.update("UPDATE app.app_user SET account_type = 'CONSUMER' WHERE account_type = 'ADMIN'");
        User lastAdmin = newAdmin();
        User formerAdmin = newUser("former-admin");

        assertThatThrownBy(() -> userService.deleteUserAsAdmin(lastAdmin.getId(), formerAdmin.getId()))
                .isInstanceOf(ConflictException.class)
                .hasMessage("error.user.lastAdminDelete");
        assertThatThrownBy(() -> userService.updateAccountType(lastAdmin.getId(), AccountType.CONSUMER, formerAdmin.getId()))
                .isInstanceOf(ConflictException.class)
                .hasMessage("error.user.lastAdmin");

        assertThat(auditOf(lastAdmin)).isEmpty();
    }

    @Test
    void aRepeatedDeleteWritesARowForEachRequest() throws Exception {
        User admin = newAdmin();
        User target = newUser("target");

        mvc.perform(deleteUser(target.getId()).with(as(admin))).andExpect(status().isOk());
        mvc.perform(deleteUser(target.getId()).with(as(admin))).andExpect(status().isOk());

        assertThat(auditOf(target)).extracting(AdminAuditEntry::getAction)
                .containsExactly(AdminAction.DELETE_USER, AdminAction.DELETE_USER);
    }

    @Test
    void theRowsSurviveErasingBothTheTargetAndTheAdmin() throws Exception {
        User admin = newAdmin();
        newAdmin();
        User demoted = newAdmin();
        User deleted = newUser("deleted");

        mvc.perform(setAccountType(demoted, AccountType.CONSUMER).with(as(admin))).andExpect(status().isOk());
        mvc.perform(deleteUser(deleted.getId()).with(as(admin))).andExpect(status().isOk());

        accountErasure.eraseOwnAccount(demoted.getId());
        accountErasure.erase(admin.getId());

        assertThat(users.existsById(demoted.getId())).isFalse();
        assertThat(users.existsById(admin.getId())).isFalse();
        assertSingleEntry(auditOf(demoted), admin, demoted, AdminAction.DEMOTE_FROM_ADMIN);
        assertSingleEntry(auditOf(deleted), admin, deleted, AdminAction.DELETE_USER);
    }

    @Test
    void readingTheUserListWritesOneRowPerAdminPerWindow() throws Exception {
        User admin = newAdmin();
        User otherAdmin = newAdmin();

        mvc.perform(get("/api/admin/users").with(as(admin))).andExpect(status().isOk());
        mvc.perform(get("/api/admin/users").with(as(admin))).andExpect(status().isOk());
        mvc.perform(get("/api/admin/users").with(as(otherAdmin))).andExpect(status().isOk());

        assertThat(adminAudit.findByActorUserIdOrderByOccurredAtAsc(admin.getId()))
                .singleElement()
                .satisfies(entry -> {
                    assertThat(entry.getAction()).isEqualTo(AdminAction.READ_USER_LIST);
                    assertThat(entry.getTargetUserId()).isNull();
                    assertThat(entry.getObjectId()).isNull();
                });
        assertThat(adminAudit.findByActorUserIdOrderByOccurredAtAsc(otherAdmin.getId())).hasSize(1);
    }

    @Test
    void aReadAfterTheWindowWritesAnotherRow() throws Exception {
        User admin = newAdmin();
        jdbc.update("""
                INSERT INTO app.admin_audit (id, actor_user_id, action, occurred_at)
                VALUES (gen_random_uuid(), ?, 'READ_USER_LIST', (now() AT TIME ZONE 'UTC') - interval '11 minutes')
                """, admin.getId());

        mvc.perform(get("/api/admin/users").with(as(admin))).andExpect(status().isOk());

        assertThat(adminAudit.findByActorUserIdOrderByOccurredAtAsc(admin.getId())).hasSize(2);
    }

    @Test
    void aRefusedListReadWritesNothing() throws Exception {
        User consumer = newUser("consumer");

        mvc.perform(get("/api/admin/users").with(as(consumer))).andExpect(status().isForbidden());

        assertThat(adminAudit.findByActorUserIdOrderByOccurredAtAsc(consumer.getId())).isEmpty();
    }

    private long auditRowCount() {
        return jdbc.queryForObject("SELECT count(*) FROM app.admin_audit", Long.class);
    }
}
