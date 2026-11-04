package disscount.user.service;

import disscount.pinnedPlace.dto.BulkPinnedPlaceRequest;
import disscount.pinnedPlace.service.PinnedPlaceService;
import disscount.pinnedStore.dto.BulkPinnedStoreRequest;
import disscount.pinnedStore.service.PinnedStoreService;
import disscount.shoppingList.dto.ShoppingListRequest;
import disscount.shoppingList.service.ShoppingListAccessService;
import disscount.shoppingList.service.ShoppingListMapper;
import disscount.shoppingList.service.ShoppingListService;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import disscount.util.Timestamps;
import disscount.watchlistItem.dto.WatchlistItemRequest;
import disscount.watchlistItem.service.WatchlistItemService;
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
@Import({WatchlistItemService.class, PinnedPlaceService.class, PinnedStoreService.class,
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
