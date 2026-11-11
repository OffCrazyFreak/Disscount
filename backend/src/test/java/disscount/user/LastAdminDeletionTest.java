package disscount.user;

import disscount.shared.errors.BadRequestException;
import disscount.shared.errors.ConflictException;
import disscount.support.FullStackTest;
import disscount.support.MigratedPostgres;
import disscount.user.erasure.AccountErasureService;
import disscount.user.erasure.ErasureLedgerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Deleting is guarded like demoting: the last live admin cannot be deleted or erase their own account.
 * PostgreSQL, because the race is decided by its row locks, and because the shared H2 database keeps
 * other tests' admins, so no H2 test can make an admin the last one.
 */
@MigratedPostgres
class LastAdminDeletionTest extends FullStackTest {

    @Autowired JdbcTemplate jdbc;
    @Autowired UserService userService;
    @Autowired AccountErasureService accountErasure;
    @Autowired ErasureLedgerRepository erasureLedger;
    @Autowired TransactionTemplate transactions;

    @BeforeEach
    void startWithNoAdmins() {
        jdbc.update("UPDATE app.app_user SET account_type = 'CONSUMER' WHERE account_type = 'ADMIN'");
    }

    private static MockHttpServletRequestBuilder eraseOwnAccount(User user) {
        return delete("/api/users/me")
                .header(HttpHeaders.ACCEPT_LANGUAGE, "hr")
                .with(jwt().jwt(j -> j.subject(user.getId().toString()).claim("purpose", "account-erasure")));
    }

    private boolean isLive(User user) {
        return users.existsById(user.getId());
    }

    @Test
    void theLastAdminCannotEraseTheirOwnAccount() throws Exception {
        User admin = newAdmin();

        mvc.perform(eraseOwnAccount(admin))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("urn:disscount:conflict"))
                .andExpect(jsonPath("$.code").value("error.user.lastAdminDelete"))
                .andExpect(jsonPath("$.detail").value("Ovo je jedini administratorski račun, pa ga ne možeš obrisati."));

        assertThat(isLive(admin)).isTrue();
        assertThat(erasureLedger.existsById(admin.getId())).isFalse();
    }

    @Test
    void anAdminMayEraseTheirOwnAccountWhileAnotherAdminStays() throws Exception {
        User admin = newAdmin();
        newAdmin();

        mvc.perform(eraseOwnAccount(admin)).andExpect(status().isOk());

        assertThat(isLive(admin)).isFalse();
    }

    @Test
    void aConsumerErasesTheirAccountEvenWithNoAdminAtAll() throws Exception {
        User consumer = newUser("consumer");

        mvc.perform(eraseOwnAccount(consumer)).andExpect(status().isOk());

        assertThat(isLive(consumer)).isFalse();
    }

    @Test
    void anAdminMayDeleteAnotherAdmin() throws Exception {
        User admin = newAdmin();
        User otherAdmin = newAdmin();

        mvc.perform(delete("/api/admin/users/{id}", otherAdmin.getId()).with(as(admin))).andExpect(status().isOk());

        assertThat(isLive(otherAdmin)).isFalse();
    }

    // Through the API only reachable in the race below, because the caller passed the admin rule.
    @Test
    void theLastAdminCannotBeDeleted() {
        User lastAdmin = newAdmin();
        User formerAdmin = newUser("former-admin");

        assertThatThrownBy(() -> userService.deleteUserAsAdmin(lastAdmin.getId(), formerAdmin.getId()))
                .isInstanceOf(ConflictException.class)
                .hasMessage("error.user.lastAdminDelete");

        assertThat(isLive(lastAdmin)).isTrue();
    }

    @Test
    void theErasureReplayStillErasesTheLastAdmin() {
        User lastAdmin = newAdmin();

        accountErasure.erase(lastAdmin.getId());

        assertThat(isLive(lastAdmin)).isFalse();
    }

    @Test
    void twoAdminsDeletingEachOtherAtOnceAreDecidedOneAfterTheOther() throws Exception {
        User first = newAdmin();
        User second = newAdmin();

        Throwable refused = raceAgainstHeldLocks(
                () -> userService.deleteUserAsAdmin(second.getId(), first.getId()),
                () -> userService.deleteUserAsAdmin(first.getId(), second.getId()));

        assertThat(refused).isInstanceOf(ConflictException.class).hasMessage("error.user.lastAdminDelete");
        assertThat(isLive(first)).isTrue();
        assertThat(isLive(second)).isFalse();
    }

    @Test
    void twoAdminsErasingTheirOwnAccountsAtOnceAreDecidedOneAfterTheOther() throws Exception {
        User first = newAdmin();
        User second = newAdmin();

        Throwable refused = raceAgainstHeldLocks(
                () -> accountErasure.eraseOwnAccount(first.getId()),
                () -> accountErasure.eraseOwnAccount(second.getId()));

        assertThat(refused).isInstanceOf(ConflictException.class).hasMessage("error.user.lastAdminDelete");
        assertThat(isLive(first)).isFalse();
        assertThat(isLive(second)).isTrue();
    }

    // Unserialized, the promotion would land on the erased account and the only real admin could then leave.
    @Test
    void aPromotionRacingAnErasureWaitsAndFindsTheAccountGone() throws Exception {
        User admin = newAdmin();
        User consumer = newUser("consumer");

        Throwable refused = raceAgainstHeldLocks(
                () -> accountErasure.eraseOwnAccount(consumer.getId()),
                () -> userService.updateAccountType(consumer.getId(), AccountType.ADMIN, admin.getId()));

        assertThat(refused).isInstanceOf(BadRequestException.class).hasMessage("error.user.notFound");
        assertThatThrownBy(() -> accountErasure.eraseOwnAccount(admin.getId()))
                .isInstanceOf(ConflictException.class)
                .hasMessage("error.user.lastAdminDelete");
    }

    /**
     * Runs the winner inside a transaction that holds its admin row locks until released, starts the loser,
     * checks the loser waits on those locks, then commits the winner and returns the loser's refusal.
     */
    private Throwable raceAgainstHeldLocks(Runnable winner, Runnable loser) throws Exception {
        CountDownLatch locksHeld = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);

        Future<?> winning = CompletableFuture.runAsync(() -> transactions.executeWithoutResult(status -> {
            winner.run();
            locksHeld.countDown();
            await(release);
        }));
        assertThat(locksHeld.await(10, TimeUnit.SECONDS)).isTrue();

        CompletableFuture<Void> losing = CompletableFuture.runAsync(loser);
        Thread.sleep(500);
        assertThat(losing).as("the second deletion waits for the first one's locks").isNotDone();

        release.countDown();
        winning.get(10, TimeUnit.SECONDS);

        return catchFailure(losing);
    }

    private static Throwable catchFailure(Future<?> future) throws Exception {
        try {
            future.get(10, TimeUnit.SECONDS);
            return null;
        } catch (ExecutionException failed) {
            return failed.getCause();
        }
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
