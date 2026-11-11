package disscount.watchlist;

import disscount.shared.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Watchlist ownership, named in the service's @PreAuthorize. A foreign item throws the item's 404 instead of
 * returning false, because a false is a 403, which would confirm the id belongs to someone.
 */
@Component("watchlistGuard")
@RequiredArgsConstructor
class WatchlistGuard {

    private final WatchlistItemRepository items;

    /** Deleted items count, so a repeat delete of your own item still answers 204. */
    public boolean ownsItem(UUID userId, UUID itemId) {
        if (!items.existsIncludingDeletedByIdAndUserId(itemId, userId)) {
            throw new NotFoundException(WatchlistItemService.NOT_FOUND);
        }

        return true;
    }
}
