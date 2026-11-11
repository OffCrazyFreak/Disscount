package disscount.watchlist;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataAccessException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import disscount.support.MigratedPostgres;
import disscount.user.ActiveUsers;
import disscount.user.User;
import disscount.user.UserRepository;

/**
 * Services default to read-only transactions, so a write method missing its @Transactional must never write.
 * PostgreSQL, because H2 ignores a read-only connection and would let the write through.
 */
@DataJpaTest(showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@MigratedPostgres
@Import({ActiveUsers.class, ReadOnlyDefaultTest.ForgetfulWatchlistService.class})
class ReadOnlyDefaultTest {

    /** Stands in for a write method someone added without @Transactional: it inherits the class default. */
    static class ForgetfulWatchlistService extends WatchlistItemService {

        private final WatchlistItemRepository items;

        ForgetfulWatchlistService(WatchlistItemRepository items, ActiveUsers activeUsers) {
            super(items, activeUsers);
            this.items = items;
        }

        public void saveAndFlushWithoutAnnotation(WatchlistItem item) {
            items.saveAndFlush(item);
        }

        public void saveWithoutAnnotation(WatchlistItem item) {
            items.save(item);
        }
    }

    @Autowired ForgetfulWatchlistService service;
    @Autowired WatchlistItemRepository items;
    @Autowired UserRepository users;

    private User owner;

    @BeforeEach
    void setUp() {
        items.deleteAll();
        owner = users.save(User.builder().id(UUID.randomUUID()).username("ana-" + UUID.randomUUID()).build());
    }

    @Test
    void aFlushedWriteIsRefusedByTheDatabase() {
        assertThatThrownBy(() -> service.saveAndFlushWithoutAnnotation(item()))
                .isInstanceOf(DataAccessException.class)
                .hasRootCauseMessage("ERROR: cannot execute INSERT in a read-only transaction");

        assertThat(items.count()).isZero();
    }

    @Test
    void anUnflushedWriteIsNeverSent() {
        service.saveWithoutAnnotation(item());

        assertThat(items.count()).isZero();
    }

    @Test
    void anAnnotatedWriteCommits() {
        service.addOrUpdateWatchlist(owner.getId(), new WatchlistItemRequest("3850123456789", WatchType.ABSOLUTE, 1.5));

        assertThat(items.count()).isOne();
    }

    private WatchlistItem item() {
        return WatchlistItem.builder()
                .userId(owner.getId())
                .productApiId("3850123456789")
                .watchType(WatchType.PERCENTAGE)
                .thresholdValue(10.0)
                .build();
    }
}
