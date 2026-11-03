package disscount.user.rest;

import disscount.support.FullStackTest;
import disscount.user.domain.User;
import disscount.user.dto.AuthIdentity;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import tools.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.Map;

import static disscount.support.WireFormat.INSTANT;
import static disscount.support.WireFormat.LOCAL_DATE_TIME;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Pins the UserDto the frontend's userDtoSchema reads, on the current user, the admin list and the account type change. */
class UserWireFormatTest extends FullStackTest {

    static final java.util.Set<String> USER_FIELDS = java.util.Set.of(
            "id", "username", "email", "notificationsPushEnabledAt", "notificationsEmailEnabledAt",
            "newsletterEnabledAt", "feedbackContactEnabledAt", "acquisitionChannel", "image",
            "onboardingCompletedAt", "onboardingOutcome", "accountType", "createdAt", "lastLoginAt", "lastActiveAt");

    @Test
    void theCurrentUserHasEveryFieldAndNullsStayInTheBody() throws Exception {
        User user = newUser("ana");

        JsonNode me = body(mvc.perform(get("/api/users/me").with(as(user))).andExpect(status().isOk()));

        assertThat(fieldNames(me)).containsExactlyInAnyOrderElementsOf(USER_FIELDS);
        assertThat(me.get("id").asString()).isEqualTo(user.getId().toString());
        assertThat(me.get("accountType").asString()).isEqualTo("CONSUMER");
        assertThat(me.get("createdAt").asString()).matches(LOCAL_DATE_TIME);
        // The current user reads the email from the better-auth session, never from here.
        assertThat(me.get("email").isNull()).isTrue();
        assertThat(me.get("lastLoginAt").isNull()).isTrue();
    }

    // The column is zone-less but stamped in UTC, so it leaves as an instant with the same clock time.
    @Test
    void theStampedActivityTimeLeavesAsAUtcInstant() throws Exception {
        User user = newUser("eva");
        user.setLastActiveAt(java.time.LocalDateTime.of(2026, 3, 1, 10, 15, 30));
        users.save(user);

        JsonNode me = body(mvc.perform(get("/api/users/me").with(as(user))).andExpect(status().isOk()));

        assertThat(me.get("lastActiveAt").asString()).isEqualTo("2026-03-01T10:15:30Z");
    }

    @Test
    void anUpdateAnswersWithTheSameShapeAndTimestampsAsZoneLessStrings() throws Exception {
        User user = newUser("ivo");

        JsonNode updated = body(mvc.perform(patch("/api/users/me").with(as(user)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notificationsPush\":true,\"acquisitionChannel\":\"FRIEND_OR_FAMILY\",\"onboardingOutcome\":\"completed\"}"))
                .andExpect(status().isOk()));

        assertThat(fieldNames(updated)).containsExactlyInAnyOrderElementsOf(USER_FIELDS);
        assertThat(updated.get("notificationsPushEnabledAt").asString()).matches(LOCAL_DATE_TIME);
        assertThat(updated.get("onboardingCompletedAt").asString()).matches(LOCAL_DATE_TIME);
        assertThat(updated.get("onboardingOutcome").asString()).isEqualTo("completed");
        assertThat(updated.get("acquisitionChannel").asString()).isEqualTo("FRIEND_OR_FAMILY");
    }

    @Test
    void theAdminListAddsTheIdentityFieldsAsInstants() throws Exception {
        User admin = newAdmin();
        User listed = newUser("marta");
        when(authIdentityDao.findByUserIds(anyList())).thenReturn(Map.of(listed.getId(),
                new AuthIdentity("marta@example.com", Instant.parse("2026-03-01T10:15:30Z"), Instant.parse("2026-03-02T08:00:00Z"))));

        JsonNode all = body(mvc.perform(get("/api/admin/users").with(as(admin))).andExpect(status().isOk()));
        JsonNode row = all.valueStream().filter(u -> u.get("id").asString().equals(listed.getId().toString()))
                .findFirst().orElseThrow();

        assertThat(fieldNames(row)).containsExactlyInAnyOrderElementsOf(USER_FIELDS);
        assertThat(row.get("email").asString()).isEqualTo("marta@example.com");
        assertThat(row.get("lastLoginAt").asString()).isEqualTo("2026-03-01T10:15:30Z");
        assertThat(row.get("lastActiveAt").asString()).matches(INSTANT);
    }

    // userDtoSchema's nullable fields are still required keys, so a null must stay in the body rather than be omitted.
    @Test
    void anAccountTypeChangeAnswersWithEveryFieldTheFrontendParses() throws Exception {
        User admin = newAdmin();
        User target = newUser("petra");
        target.setLastActiveAt(java.time.LocalDateTime.of(2026, 3, 1, 10, 15, 30));
        users.save(target);

        JsonNode updated = body(mvc.perform(patch("/api/admin/users/{id}", target.getId()).with(as(admin))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"accountType\":\"ENTERPRISE\"}"))
                .andExpect(status().isOk()));

        assertThat(fieldNames(updated)).containsExactlyInAnyOrderElementsOf(USER_FIELDS);
        assertThat(updated.get("id").asString()).isEqualTo(target.getId().toString());
        assertThat(updated.get("accountType").asString()).isEqualTo("ENTERPRISE");
        assertThat(updated.get("createdAt").asString()).matches(LOCAL_DATE_TIME);
        assertThat(updated.get("lastActiveAt").asString()).isEqualTo("2026-03-01T10:15:30Z");
    }

    @Test
    void anAdminDeleteAnswersWithAMessageObject() throws Exception {
        User admin = newAdmin();
        User target = newUser("target");

        JsonNode answer = body(mvc.perform(delete("/api/admin/users/{id}", target.getId()).with(as(admin)))
                .andExpect(status().isOk()));

        assertThat(fieldNames(answer)).containsExactly("message");
    }
}
