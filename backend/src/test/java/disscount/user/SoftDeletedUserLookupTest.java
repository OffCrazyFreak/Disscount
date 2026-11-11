package disscount.user;

import disscount.preferences.BulkPinnedPlaceRequest;
import disscount.preferences.BulkPinnedStoreRequest;
import disscount.preferences.PinnedPlaceService;
import disscount.preferences.PinnedStoreService;
import disscount.shared.Timestamps;
import disscount.shoppinglist.ShoppingListAccessService;
import disscount.shoppinglist.ShoppingListMapper;
import disscount.shoppinglist.ShoppingListRequest;
import disscount.shoppinglist.ShoppingListService;
import disscount.watchlist.WatchlistItemRequest;
import disscount.watchlist.WatchlistItemService;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** A token minted before the deletion is still valid for its lifetime, so each lookup must refuse the row itself. */
@DataJpaTest(showSql = false)
@Import({ActiveUsers.class, WatchlistItemService.class, PinnedPlaceService.class, PinnedStoreService.class,
        ShoppingListService.class, ShoppingListAccessService.class,
        ShoppingListMapper.class})
class SoftDeletedUserLookupTest {

    @Autowired UserRepository users;
    @Autowired WatchlistItemService watchlist;
    @Autowired PinnedPlaceService pinnedPlaces;
    @Autowired PinnedStoreService pinnedStores;
    @Autowired ShoppingListService shoppingLists;

    private UUID deletedUserId;

    @BeforeEach
    void setUp() {
        deletedUserId = users.save(User.builder().id(UUID.randomUUID()).deletedAt(Timestamps.nowUtc()).build()).getId();
    }

    private static void assertRefusedAsUnknownUser(ThrowingCallable call) {
        assertThatThrownBy(call).hasMessage("error.user.notFound");
    }

    @Test
    void aSoftDeletedUserCannotWriteAWatchlistItem() {
        assertRefusedAsUnknownUser(() -> watchlist.addOrUpdateWatchlist(deletedUserId, new WatchlistItemRequest()));
    }

    @Test
    void aSoftDeletedUserCannotReplacePinnedPlaces() {
        assertRefusedAsUnknownUser(() -> pinnedPlaces.updatePinnedPlaces(deletedUserId, new BulkPinnedPlaceRequest()));
    }

    @Test
    void aSoftDeletedUserCannotReplacePinnedStores() {
        assertRefusedAsUnknownUser(() -> pinnedStores.updatePinnedStores(deletedUserId, new BulkPinnedStoreRequest()));
    }

    @Test
    void aSoftDeletedUserCannotCreateOrReadShoppingLists() {
        assertRefusedAsUnknownUser(() -> shoppingLists.createShoppingList(deletedUserId, new ShoppingListRequest()));
        assertRefusedAsUnknownUser(() -> shoppingLists.getUserShoppingLists(deletedUserId));
        assertRefusedAsUnknownUser(() -> shoppingLists.requireWriteUser(deletedUserId));
    }
}
