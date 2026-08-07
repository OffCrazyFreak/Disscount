package disscount.shoppingList.service;

import org.springframework.stereotype.Service;

import disscount.shoppingList.domain.ListAccess;
import disscount.shoppingList.domain.ShoppingList;

import java.util.UUID;

/**
 * The single authorization rule for shopping lists. Membership adds a
 * max(member permission, link access) branch here and nowhere else.
 */
@Service
public class ShoppingListAccessService {

    /**
     * @param userId the caller, or null when the request carries no token at all
     */
    public ListAccess resolve(ShoppingList list, UUID userId) {
        if (userId != null && userId.equals(list.getOwner().getId())) {
            return ListAccess.OWNER;
        }

        ListAccess link = list.resolvedLinkAccess();
        if (link == ListAccess.NONE) {
            return ListAccess.NONE;
        }

        // Anonymous callers are capped at VIEW however generous the link is, which is what
        // keeps every write attributable to an account.
        return userId == null ? ListAccess.VIEW : link;
    }
}
