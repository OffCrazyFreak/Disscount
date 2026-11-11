package disscount.user;

import disscount.shared.Timestamps;
import disscount.support.IncludingDeleted;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.jdbc.JdbcTestUtils;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(showSql = false)
class ErasureBackfillRunnerTest {

    @Autowired UserRepository users;
    @Autowired ErasureLedgerRepository erasureLedger;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager entityManager;

    private ErasureBackfillRunner runner;

    @BeforeEach
    void setUp() {
        JdbcTestUtils.deleteFromTables(jdbc, "app.erasure_ledger", "app.app_user");
        runner = new ErasureBackfillRunner(erasureLedger, users);
    }

    private User saveUser(String username, LocalDateTime deletedAt) {
        return users.saveAndFlush(User.builder().id(UUID.randomUUID()).username(username).deletedAt(deletedAt).build());
    }

    private User includingDeleted(UUID id) {
        entityManager.clear();
        return IncludingDeleted.find(entityManager, User.class, id).orElseThrow();
    }

    @Test
    void aProfileDeletedBeforeTheLedgerGetsATombstoneAtItsDeletionTimeAndLosesItsName() {
        LocalDateTime deletedAt = Timestamps.nowUtc().minusDays(90).truncatedTo(ChronoUnit.MILLIS);
        User legacy = saveUser("stari", deletedAt);

        runner.run(null);

        assertThat(erasureLedger.findById(legacy.getId())).get().satisfies(entry -> {
            assertThat(entry.getErasedAt()).isEqualTo(deletedAt);
            assertThat(entry.getScope()).isEqualTo(ErasureLedgerEntry.ACCOUNT);
        });
        assertThat(includingDeleted(legacy.getId()).getUsername()).isNull();
        assertThat(users.existsByUsername("stari")).isFalse();
    }

    @Test
    void liveProfilesAndExistingTombstonesStayAsTheyAre() {
        User live = saveUser("ziva", null);
        User erased = saveUser(null, Timestamps.nowUtc().minusDays(2));
        LocalDateTime erasedAt = Timestamps.nowUtc().minusDays(1).truncatedTo(ChronoUnit.MILLIS);
        erasureLedger.saveAndFlush(new ErasureLedgerEntry(erased.getId(), erasedAt));

        runner.run(null);

        assertThat(erasureLedger.count()).isEqualTo(1);
        assertThat(erasureLedger.findById(erased.getId()).orElseThrow().getErasedAt()).isEqualTo(erasedAt);
        assertThat(includingDeleted(live.getId()).getUsername()).isEqualTo("ziva");
    }

    @Test
    void aSecondRunChangesNothing() {
        saveUser("stari", Timestamps.nowUtc().minusDays(90));
        runner.run(null);

        assertThat(erasureLedger.tombstoneDeletedProfiles()).isZero();
        assertThat(users.clearUsernamesOfDeletedProfiles()).isZero();
    }
}
