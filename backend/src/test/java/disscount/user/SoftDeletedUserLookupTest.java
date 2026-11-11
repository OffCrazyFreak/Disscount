package disscount.user;

import disscount.preferences.BulkPinnedPlaceRequest;
import disscount.preferences.BulkPinnedStoreRequest;
import disscount.preferences.PinnedPlaceService;
import disscount.preferences.PinnedStoreService;
import disscount.shared.Timestamps;
import disscount.shoppinglist.ShoppingListAccessService;
import disscount.shoppinglist.ShoppingListGuard;
import disscount.shoppinglist.ShoppingListMapper;
import disscount.shoppinglist.ShoppingListQuota;
import disscount.shoppinglist.ShoppingListRequest;
import disscount.shoppinglist.ShoppingListService;
import disscount.watchlist.WatchlistItemRequest;
import disscount.watchlist.WatchlistItemService;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** A token minted before the deletion is still valid for its lifetime, so each lookup must refuse the row itself. */
@DataJpaTest(showSql = false)
@Import({ActiveUsers.class, AuthIdentityDao.class, WatchlistItemService.class, PinnedPlaceService.class, PinnedStoreService.class,
        ShoppingListService.class, ShoppingListAccessService.class, ShoppingListGuard.class,
        ShoppingListMapper.class, ShoppingListQuota.class})
class SoftDeletedUserLookupTest {

    @Autowired UserRepository users;
    @Autowired TestEntityManager entityManager;
    @Autowired WatchlistItemService watchlist;
    @Autowired PinnedPlaceService pinnedPlaces;
    @Autowired PinnedStoreService pinnedStores;
    @Autowired ShoppingListService shoppingLists;
    @Autowired ShoppingListGuard shoppingListGuard;

    private UUID deletedUserId;

    @BeforeEach
    void setUp() {
        deletedUserId = users.saveAndFlush(User.builder().id(UUID.randomUUID()).deletedAt(Timestamps.nowUtc()).build()).getId();
        // A later request starts a new persistence context; the saved instance would otherwise answer lookups by id.
        entityManager.clear();
    }

    private static void assertRefusedAsUnknownUser(ThrowingCallable call) {
        assertThatThrownBy(call).hasMessage("error.user.notFound");
    }

    @Test
    void aSoftDeletedUserCannotWriteAWatchlistItem() {
        assertRefusedAsUnknownUser(() -> watchlist.addOrUpdateWatchlist(deletedUserId, new WatchlistItemRequest(null, null, null)));
    }

    @Test
    void aSoftDeletedUserCannotReplacePinnedPlaces() {
        assertRefusedAsUnknownUser(() -> pinnedPlaces.updatePinnedPlaces(deletedUserId, new BulkPinnedPlaceRequest(List.of())));
    }

    @Test
    void aSoftDeletedUserCannotReplacePinnedStores() {
        assertRefusedAsUnknownUser(() -> pinnedStores.updatePinnedStores(deletedUserId, new BulkPinnedStoreRequest(List.of())));
    }

    @Test
    void aSoftDeletedUserCannotCreateOrReadShoppingLists() {
        assertRefusedAsUnknownUser(() -> shoppingLists.createShoppingList(deletedUserId, new ShoppingListRequest("Popis", null)));
        assertRefusedAsUnknownUser(() -> shoppingLists.getUserShoppingLists(deletedUserId));
        assertRefusedAsUnknownUser(() -> shoppingListGuard.requireWriteUser(deletedUserId));
    }
}
