package disscount.shoppinglist;

import org.springframework.stereotype.Service;

import java.util.UUID;

/** Membership adds a max(member permission, link access) branch here and nowhere else. */
@Service
public class ShoppingListAccessService {

    /** @param userId the caller, or null when the request carries no token at all */
    public ListAccess resolve(ShoppingList list, UUID userId) {
        if (userId != null && userId.equals(list.getOwnerId())) {
            return ListAccess.OWNER;
        }

        ListAccess link = list.resolvedLinkAccess();
        if (link == ListAccess.NONE) {
            return ListAccess.NONE;
        }

        // Capped at VIEW however generous the link, which keeps every write attributable to an account.
        return userId == null ? ListAccess.VIEW : link;
    }
}
