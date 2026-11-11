package disscount.watchlist;

import disscount.shared.LimitReachedException;
import disscount.shared.UserLimit;
import disscount.support.Concurrently;
import disscount.user.ActiveUsers;
import disscount.user.User;
import disscount.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.jdbc.JdbcTestUtils;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Not transactional on purpose: the race needs each add to commit on its own connection.
@DataJpaTest(showSql = false)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({ActiveUsers.class, WatchlistItemService.class})
class WatchlistLimitTest {

    private static final int LIMIT = UserLimit.WATCHLIST_ITEMS.max();

    @Autowired WatchlistItemService service;
    @Autowired WatchlistItemRepository watchlist;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;

    User owner;

    @BeforeEach
    void setUp() {
        // Row by row would skip soft-deleted rows, which @SQLRestriction hides from JPA.
        JdbcTestUtils.deleteFromTables(jdbc, "app.watchlist_item", "app.app_user");
        owner = users.save(User.builder().id(UUID.randomUUID()).username("ana").build());
    }

    @Test
    void theFiftiethEntryPassesAndTheNextIsRefused() {
        saveEntries(LIMIT - 1);
        add("zadnji");

        assertThatThrownBy(() -> add("visak"))
                .isInstanceOfSatisfying(LimitReachedException.class,
                        e -> assertThat(e.getLimit()).isEqualTo(UserLimit.WATCHLIST_ITEMS));
        assertThat(watchlist.countActiveByUserId(owner.getId())).isEqualTo(LIMIT);
    }

    @Test
    void changingAThresholdAtTheCapStillPasses() {
        saveEntries(LIMIT);

        assertThat(add("proizvod-0").thresholdValue()).isEqualTo(5.0);
    }

    @Test
    void aRemovedEntryFreesItsPlace() {
        saveEntries(LIMIT);
        service.removeFromWatchlist(watchlist.findByUserId(owner.getId()).get(0).getId(), owner.getId());

        assertThat(add("novi").productApiId()).isEqualTo("novi");
    }

    @Test
    void concurrentAddsCannotPassTheCap() throws Exception {
        saveEntries(LIMIT - 1);

        List<Throwable> failures = Concurrently.run(6, i -> add("novi-" + i));

        assertThat(failures).hasSize(5).allMatch(LimitReachedException.class::isInstance);
        assertThat(watchlist.countActiveByUserId(owner.getId())).isEqualTo(LIMIT);
    }

    private WatchlistItemDto add(String productApiId) {
        return service.addOrUpdateWatchlist(owner.getId(), new WatchlistItemRequest(productApiId, WatchType.PERCENTAGE, 5.0));
    }

    private void saveEntries(int count) {
        watchlist.saveAll(IntStream.range(0, count).mapToObj(i -> WatchlistItem.builder()
                .userId(owner.getId())
                .productApiId("proizvod-" + i)
                .watchType(WatchType.PERCENTAGE)
                .thresholdValue(10.0)
                .build()).toList());
    }
}
