package disscount.user;

import disscount.support.FullStackTest;
import disscount.support.MigratedPostgres;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The share link and contact message parts of the erasure, on PostgreSQL: the race is decided by its row locks,
 * and the address match is native SQL that H2 reads more loosely.
 */
@MigratedPostgres
class AccountErasurePostgresTest extends FullStackTest {

    @Autowired JdbcTemplate jdbc;
    @Autowired AccountErasureService accountErasure;
    @Autowired TransactionTemplate transactions;

    private UUID createList(User owner, String linkAccess) throws Exception {
        String request = "{\"title\":\"Popis\",\"linkAccess\":\"" + linkAccess + "\"}";

        return UUID.fromString(body(mvc.perform(post("/api/shopping-lists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request)
                        .with(as(owner)))
                .andExpect(status().isOk())).get("id").asString());
    }

    private String linkAccessOf(UUID listId) {
        return jdbc.queryForObject("SELECT link_access FROM app.shopping_list WHERE id = ?", String.class, listId);
    }

    private UUID saveMessage(UUID senderId, String email, boolean deleted) {
        UUID id = UUID.randomUUID();

        jdbc.update("""
                INSERT INTO app.contact_message (id, created_at, updated_at, deleted_at, email, full_name, subject, message, user_id)
                VALUES (?, now(), now(), CASE WHEN ? THEN now() END, ?, 'Ana', 'Pozdrav', 'Tekst', ?)
                """, id, deleted, email, senderId);

        return id;
    }

    private boolean isBlanked(UUID messageId) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT email IS NULL AND full_name IS NULL AND message = 'Tekst' FROM app.contact_message WHERE id = ?",
                Boolean.class, messageId));
    }

    @Test
    void contactMessagesLoseNameAndAddressBySenderAndBySignedOutLoginAddress() {
        User leaving = newUser("leaving");
        User other = newUser("other");
        String email = "Leaving." + leaving.getId() + "@example.com";
        when(authIdentityDao.findEmail(leaving.getId())).thenReturn(Optional.of(email));

        UUID signedIn = saveMessage(leaving.getId(), "drugi@example.com", false);
        UUID signedOut = saveMessage(null, email.toLowerCase(), false);
        UUID hiddenByAdmin = saveMessage(leaving.getId(), email, true);
        UUID otherAccountTypedTheAddress = saveMessage(other.getId(), email, false);
        UUID stranger = saveMessage(null, "stranac@example.com", false);

        accountErasure.erase(leaving.getId());

        assertThat(isBlanked(signedIn)).isTrue();
        assertThat(isBlanked(signedOut)).isTrue();
        assertThat(isBlanked(hiddenByAdmin)).isTrue();
        assertThat(isBlanked(otherAccountTypedTheAddress)).isFalse();
        assertThat(isBlanked(stranger)).isFalse();
    }

    @Test
    void anErasureWithNoLoginLeftMatchesNoSignedOutMessage() {
        User leaving = newUser("leaving");
        UUID signedOut = saveMessage(null, "netko@example.com", false);

        accountErasure.erase(leaving.getId());

        assertThat(isBlanked(signedOut)).isFalse();
    }

    // Without the owner's row lock, the share waits on the list row instead and switches the link back on after the commit.
    @Test
    void aShareChangeRacingTheErasureWaitsAndIsRefused() throws Exception {
        User owner = newUser("owner");
        UUID listId = createList(owner, "VIEW");

        CountDownLatch erasing = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);

        CompletableFuture<Void> erasure = CompletableFuture.runAsync(() -> transactions.executeWithoutResult(status -> {
            accountErasure.erase(owner.getId());
            erasing.countDown();
            await(release);
        }));
        assertThat(erasing.await(10, TimeUnit.SECONDS)).isTrue();

        CompletableFuture<Integer> share = CompletableFuture.supplyAsync(() -> {
            try {
                return mvc.perform(put("/api/shopping-lists/{id}", listId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\":\"Popis\",\"linkAccess\":\"EDIT\"}")
                                .with(as(owner)))
                        .andReturn().getResponse().getStatus();
            } catch (Exception failed) {
                throw new IllegalStateException(failed);
            }
        });
        Thread.sleep(500);
        assertThat(share).as("the share change waits for the erasure's owner lock").isNotDone();

        release.countDown();
        erasure.get(10, TimeUnit.SECONDS);

        assertThat(share.get(10, TimeUnit.SECONDS)).isEqualTo(401);
        assertThat(linkAccessOf(listId)).isNull();
    }

    // Without the lock, the message passes the live check before the erasure commits and keeps its sender afterwards.
    @Test
    void aSignedInContactMessageRacingTheErasureWaitsAndKeepsNoSender() throws Exception {
        User sender = newUser("sender");
        String subject = "Utrka " + sender.getId();

        CountDownLatch erasing = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);

        CompletableFuture<Void> erasure = CompletableFuture.runAsync(() -> transactions.executeWithoutResult(status -> {
            accountErasure.erase(sender.getId());
            erasing.countDown();
            await(release);
        }));
        assertThat(erasing.await(10, TimeUnit.SECONDS)).isTrue();

        CompletableFuture<Integer> send = CompletableFuture.supplyAsync(() -> {
            try {
                return mvc.perform(post("/api/contact")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"email":"ana@example.com","fullName":"Ana","subject":"%s","message":"Tekst"}
                                        """.formatted(subject))
                                .with(as(sender)))
                        .andReturn().getResponse().getStatus();
            } catch (Exception failed) {
                throw new IllegalStateException(failed);
            }
        });
        Thread.sleep(500);
        assertThat(send).as("the message waits for the erasure's owner lock").isNotDone();

        release.countDown();
        erasure.get(10, TimeUnit.SECONDS);

        assertThat(send.get(10, TimeUnit.SECONDS)).isEqualTo(200);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM app.contact_message WHERE subject = ? AND user_id IS NULL",
                Long.class, subject)).isEqualTo(1);
    }

    private static void await(CountDownLatch latch) {
        try {
            latch.await(10, TimeUnit.SECONDS);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(interrupted);
        }
    }
}
