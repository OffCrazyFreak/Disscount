package disscount.user;

import disscount.shared.Timestamps;
import disscount.support.IncludingDeleted;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.jdbc.JdbcTestUtils;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import static org.mockito.Mockito.verify;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Account reads that need deleted profiles, which @SQLRestriction hides, so the erasure ledger answers them. */
// Not transactional on purpose: the profile insert runs in its own transaction and must really commit or collide.
@DataJpaTest(showSql = false)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({UserService.class, UserProfileCreator.class, ActiveUsers.class})
class ErasedProfileReadsTest {

    @MockitoBean AuthIdentityDao authIdentityDao;
    @MockitoBean AvatarSanitizer avatarSanitizer;

    @Autowired UserService userService;
    @Autowired UserRepository users;
    @Autowired ErasureLedgerRepository erasureLedger;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager entityManager;

    @BeforeEach
    void setUp() {
        JdbcTestUtils.deleteFromTables(jdbc, "erasure_ledger", "app_user");
    }

    private void signIn(UUID id) {
        userService.ensureActiveProfile(id, "ana@example.com", "Ana", null);
    }

    private AccountType accountTypeOf(UUID id) {
        return users.findById(id).orElseThrow().getAccountType();
    }

    private long rowsWithId(UUID id) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM app_user WHERE id = ?", Long.class, id);
    }

    @Test
    void theFirstSignInOnAnEmptyDatabaseIsTheAdmin() {
        UUID first = UUID.randomUUID();
        signIn(first);

        assertThat(accountTypeOf(first)).isEqualTo(AccountType.ADMIN);
    }

    @Test
    void anErasedFirstAdminNeverMakesTheNextSignInAnAdmin() {
        UUID first = UUID.randomUUID();
        signIn(first);
        userService.deleteAccount(first);

        UUID next = UUID.randomUUID();
        signIn(next);

        assertThat(accountTypeOf(next)).isEqualTo(AccountType.CONSUMER);
    }

    @Test
    void aTombstoneWithoutAProfileAlsoCountsForTheFirstAdmin() {
        userService.deleteAccount(UUID.randomUUID());

        UUID next = UUID.randomUUID();
        signIn(next);

        assertThat(accountTypeOf(next)).isEqualTo(AccountType.CONSUMER);
    }

    @Test
    void anErasedProfileIsToldSoAndNeverInsertedAgain() {
        UUID id = UUID.randomUUID();
        signIn(id);
        userService.deleteAccount(id);

        assertThatThrownBy(() -> signIn(id)).isInstanceOf(AccountErasedException.class);
        assertThat(rowsWithId(id)).isEqualTo(1);
    }

    // The admin list only shows live accounts, but a second request for one just erased must not turn into a 400.
    @Test
    void anAdminCanEraseAnAlreadyErasedAccountAgain() {
        UUID id = UUID.randomUUID();
        signIn(id);
        userService.deleteAccount(id);

        userService.deleteUserAsAdmin(id, UUID.randomUUID());

        verify(authIdentityDao).deleteById(id);
        assertThat(erasureLedger.count()).isEqualTo(1);
    }

    // Deleted before the ledger existed and not backfilled yet: only the collision on the id shows the hidden row.
    @Test
    void aProfileDeletedBeforeTheLedgerIsToldSoAndNeverInsertedAgain() {
        UUID id = UUID.randomUUID();
        LocalDateTime deletedAt = Timestamps.nowUtc().minusDays(30).truncatedTo(ChronoUnit.MILLIS);
        users.save(User.builder().id(id).username("Ana").deletedAt(deletedAt).build());

        assertThatThrownBy(() -> signIn(id)).isInstanceOf(AccountErasedException.class);

        assertThat(rowsWithId(id)).isEqualTo(1);
        assertThat(IncludingDeleted.find(entityManager, User.class, id)).get()
                .satisfies(user -> assertThat(user.getDeletedAt()).isEqualTo(deletedAt));
        assertThat(erasureLedger.existsById(id)).isFalse();
    }
}
