package disscount.shoppinglist;

import org.springframework.stereotype.Service;

import java.util.UUID;

/** Membership adds a max(member permission, link access) branch here and nowhere else. */
@Service
public class ShoppingListAccessService {

    public ListAccess resolve(ShoppingList list, UUID userId) {
        return resolve(new ListSharing(list.getOwnerId(), list.getLinkAccess()), userId);
    }

    /** @param userId the caller, or null when the request carries no token at all */
    ListAccess resolve(ListSharing sharing, UUID userId) {
        if (userId != null && userId.equals(sharing.ownerId())) {
            return ListAccess.OWNER;
        }

        ListAccess link = sharing.resolvedLinkAccess();
        if (link == ListAccess.NONE) {
            return ListAccess.NONE;
        }

        // Capped at VIEW however generous the link, which keeps every write attributable to an account.
        return userId == null ? ListAccess.VIEW : link;
    }
}
