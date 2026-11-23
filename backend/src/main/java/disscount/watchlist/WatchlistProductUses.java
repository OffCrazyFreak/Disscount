package disscount.watchlist;

import java.util.List;

import disscount.shared.ProductUseCount;
import disscount.shared.ProductUseSource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional(readOnly = true)
class WatchlistProductUses implements ProductUseSource {

    private final WatchlistItemRepository items;

    WatchlistProductUses(WatchlistItemRepository items) {
        this.items = items;
    }

    @Override
    public List<ProductUseCount> countPeoplePerEan() {
        return items.countUsersPerProduct();
    }
}
