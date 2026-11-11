package disscount.shoppinglist;

import disscount.shared.UserLimit;
import disscount.user.ActiveUsers;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/** Only an owner creates lists or adds items, so the owner's row lock serializes every count against its cap. */
@Component
@RequiredArgsConstructor
public class ShoppingListQuota {

    private final ShoppingListRepository lists;
    private final ShoppingListItemRepository items;
    private final ActiveUsers activeUsers;

    public void requireRoomForList(UUID ownerId, int itemsOnIt) {
        activeUsers.lockActive(ownerId);

        UserLimit.SHOPPING_LISTS.requireRoomFor(lists.countActiveByOwnerId(ownerId), 1);
        UserLimit.SHOPPING_LIST_ITEMS.requireRoomFor(0, itemsOnIt);
    }

    /** Before looking for a row to merge into, so two adds of one new product merge instead of the second being refused. */
    public void lockOwner(ShoppingList list) {
        activeUsers.lockActive(list.getOwnerId());
    }

    /** Only after {@link #lockOwner}, which makes the count exact. */
    public void requireRoomForItem(ShoppingList list) {
        UserLimit.SHOPPING_LIST_ITEMS.requireRoomFor(items.countActiveByShoppingList(list), 1);
    }
}
