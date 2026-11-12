package disscount.user.erasure;

import disscount.contact.ContactMessage;
import disscount.contact.ContactMessageRepository;
import disscount.digitalcard.DigitalCardService;
import disscount.shared.photo.TestImages;
import disscount.shared.Timestamps;
import disscount.support.FullStackTest;
import disscount.support.IncludingDeleted;
import disscount.support.MigratedPostgres;
import disscount.user.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The native queries that read soft-deleted rows, run on the database production uses.
 * The rest of the suite runs them on H2, whose SQL dialect is close to PostgreSQL but not the same.
 */
@MigratedPostgres
class SoftDeletePostgresTest extends FullStackTest {

    private static final String CARD = """
            {"cardName":"Moja","cardType":"loyalty","storeName":"Konzum","codeValue":"123","codeType":"ean_13","cardColor":"#D50000"}
            """;

    @Autowired JdbcTemplate jdbc;
    @Autowired ContactMessageRepository contactMessages;
    @Autowired DigitalCardService cardService;
    @Autowired ErasureLedgerRepository erasureLedger;
    @Autowired AccountErasureService accountErasure;
    @Autowired TransactionTemplate transactions;

    private static MockHttpServletRequestBuilder withJson(MockHttpServletRequestBuilder request, String body) {
        return request.contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private long count(String sql, Object... args) {
        return jdbc.queryForObject(sql, Long.class, args);
    }

    private UUID putCard(User owner) throws Exception {
        UUID id = UUID.randomUUID();
        mvc.perform(withJson(put("/api/digital-cards/{id}", id), CARD).with(as(owner))).andExpect(status().isOk());
        return id;
    }

    @Test
    void aRepeatWatchlistDeleteStaysA204() throws Exception {
        User owner = newUser("watcher");
        String id = body(mvc.perform(withJson(post("/api/watchlist"),
                        "{\"productApiId\":\"3850123456789\",\"watchType\":\"PERCENTAGE\",\"thresholdValue\":10}")
                .with(as(owner))).andExpect(status().isOk())).get("id").asString();

        mvc.perform(delete("/api/watchlist/{id}", id).with(as(owner))).andExpect(status().isNoContent());
        mvc.perform(delete("/api/watchlist/{id}", id).with(as(owner))).andExpect(status().isNoContent());

        assertThat(count("SELECT COUNT(*) FROM app.watchlist_item WHERE id = ? AND deleted_at IS NOT NULL", UUID.fromString(id)))
                .isEqualTo(1);
    }

    @Test
    void theAdminListsOpensMarksAndRestoresADeletedContactMessage() throws Exception {
        User admin = newAdmin();
        UUID id = contactMessages.save(ContactMessage.builder().subject("Pitanje").message("Poruka").build()).getId();
        mvc.perform(delete("/api/admin/contact/{id}", id).with(as(admin))).andExpect(status().isOk());

        mvc.perform(get("/api/admin/contact").with(as(admin)))
                .andExpect(jsonPath("$.items[?(@.id == '%s')]", id).doesNotExist());
        mvc.perform(get("/api/admin/contact").param("includeDeleted", "true").with(as(admin)))
                .andExpect(jsonPath("$.items[?(@.id == '%s')].deletedAt", id).isNotEmpty());
        mvc.perform(get("/api/admin/contact/{id}", id).with(as(admin))).andExpect(status().isOk());
        mvc.perform(patch("/api/admin/contact/{id}/read", id).with(as(admin)))
                .andExpect(jsonPath("$.readAt").isNotEmpty());

        mvc.perform(patch("/api/admin/contact/{id}/restore", id).with(as(admin)))
                .andExpect(jsonPath("$.deletedAt").isEmpty());
        mvc.perform(get("/api/admin/contact").with(as(admin)))
                .andExpect(jsonPath("$.items[?(@.id == '%s')]", id).exists());
    }

    @Test
    void aReplayedCreateOfADeletedCardIsNotFoundForEveryUser() throws Exception {
        User owner = newUser("owner");
        User stranger = newUser("stranger");
        UUID id = putCard(owner);
        mvc.perform(delete("/api/digital-cards/{id}", id).with(as(owner))).andExpect(status().is2xxSuccessful());

        mvc.perform(withJson(put("/api/digital-cards/{id}", id), CARD).with(as(owner))).andExpect(status().isNotFound());
        mvc.perform(withJson(put("/api/digital-cards/{id}", id), CARD).with(as(stranger))).andExpect(status().isNotFound());
    }

    @Test
    void thePurgeTakesADeletedCardAndAPhotoStillOnIt() throws Exception {
        User owner = newUser("purged");
        UUID id = putCard(owner);
        mvc.perform(multipart(HttpMethod.PUT, "/api/digital-cards/{id}/photos/{slot}", id, "icon")
                .file(new MockMultipartFile("full", "icon.webp", "image/webp", TestImages.webp(32, 32)))
                .with(as(owner))).andExpect(status().isOk());
        jdbc.update("UPDATE app.wallet_card SET deleted_at = ? WHERE id = ?", Timestamps.nowUtc().minusDays(31), id);

        assertThat(cardService.purgeDeletedBefore(Timestamps.nowUtc().minusDays(30))).isPositive();

        assertThat(count("SELECT COUNT(*) FROM app.wallet_card WHERE id = ?", id)).isZero();
        assertThat(count("SELECT COUNT(*) FROM app.wallet_card_photo WHERE card_id = ?", id)).isZero();
    }

    @Test
    void erasureTakesTheDeletedCardsAndTheNextSignInIsTold410() throws Exception {
        User leaving = newUser("leaving");
        UUID deletedCard = putCard(leaving);
        putCard(leaving);
        mvc.perform(delete("/api/digital-cards/{id}", deletedCard).with(as(leaving))).andExpect(status().is2xxSuccessful());

        mvc.perform(delete("/api/users/me").with(jwt().jwt(j -> j.subject(leaving.getId().toString())
                .claim("purpose", "account-erasure")))).andExpect(status().isOk());

        assertThat(count("SELECT COUNT(*) FROM app.wallet_card WHERE user_id = ?", leaving.getId())).isZero();
        mvc.perform(get("/api/users/me").with(signInAs(leaving.getId()))).andExpect(status().isGone());
        assertThat(count("SELECT COUNT(*) FROM app.app_user WHERE id = ?", leaving.getId())).isEqualTo(1);
    }

    @Test
    void aProfileDeletedBeforeTheLedgerIsTold410AndNeverInsertedAgain() throws Exception {
        UUID id = UUID.randomUUID();
        users.save(User.builder().id(id).username("legacy-" + id).deletedAt(Timestamps.nowUtc().minusDays(60)).build());

        mvc.perform(get("/api/users/me").with(signInAs(id))).andExpect(status().isGone());

        assertThat(count("SELECT COUNT(*) FROM app.app_user WHERE id = ?", id)).isEqualTo(1);
    }

    @Test
    void theBackfillTombstonesOldDeletedProfilesOnceAndErasesThem() {
        LocalDateTime deletedAt = Timestamps.nowUtc().minusDays(90).truncatedTo(ChronoUnit.MICROS);
        UUID legacy = users.save(User.builder().id(UUID.randomUUID()).username("legacy-" + UUID.randomUUID())
                .deletedAt(deletedAt).build()).getId();
        User live = newUser("live");
        UUID list = UUID.randomUUID();
        jdbc.update("INSERT INTO app.shopping_list (id, created_at, updated_at, title, owner_id, link_access) "
                + "VALUES (?, now(), now(), 'Popis', ?, 'EDIT')", list, legacy);
        UUID message = UUID.randomUUID();
        jdbc.update("INSERT INTO app.contact_message (id, created_at, updated_at, email, full_name, subject, message, user_id) "
                + "VALUES (?, now(), now(), 'ana@example.com', 'Ana', 'Pozdrav', 'Tekst', ?)", message, legacy);
        // The bean's @Transactional proxy only exists under its profile, so the test opens the same write transaction.
        ErasureBackfillRunner runner = new ErasureBackfillRunner(erasureLedger, users, accountErasure);
        Runnable backfill = () -> transactions.executeWithoutResult(status -> runner.run(null));

        backfill.run();

        assertThat(erasureLedger.findById(legacy)).get()
                .satisfies(entry -> assertThat(entry.getErasedAt()).isEqualTo(deletedAt));
        assertThat(IncludingDeleted.find(entityManager, User.class, legacy).orElseThrow().getUsername()).isNull();
        assertThat(users.findById(live.getId()).orElseThrow().getUsername()).isEqualTo(live.getUsername());
        assertThat(count("SELECT COUNT(*) FROM app.shopping_list WHERE id = ? AND link_access IS NULL", list)).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM app.contact_message WHERE id = ? AND email IS NULL AND full_name IS NULL "
                + "AND message = 'Tekst'", message)).isEqualTo(1);

        long tombstones = erasureLedger.count();
        backfill.run();

        assertThat(erasureLedger.count()).isEqualTo(tombstones);
        assertThat(count("SELECT COUNT(*) FROM app.app_user u WHERE u.deleted_at IS NOT NULL AND NOT EXISTS "
                + "(SELECT 1 FROM app.erasure_ledger l WHERE l.user_id = u.id)")).isZero();
        assertThat(count("SELECT COUNT(*) FROM app.app_user WHERE deleted_at IS NOT NULL AND username IS NOT NULL")).isZero();
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor signInAs(UUID id) {
        return jwt().jwt(j -> j.subject(id.toString()).claim("email", "ana@example.com").claim("name", "Ana"));
    }
}
