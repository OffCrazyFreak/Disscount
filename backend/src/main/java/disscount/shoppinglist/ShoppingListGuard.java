package disscount.shoppinglist;

import disscount.shared.ForbiddenException;
import disscount.shared.NotFoundException;
import disscount.shared.UnauthorizedException;
import disscount.user.ActiveUsers;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.function.Predicate;

/**
 * Who may do what to a shopping list (docs/SHARING.md), named in the services' @PreAuthorize.
 * Each check throws instead of returning false, because a false is always a 403, and an invisible list must
 * answer 404 and an anonymous write 401, as the services do.
 */
@Component("shoppingListGuard")
@RequiredArgsConstructor
public class ShoppingListGuard {

    private final ShoppingListRepository lists;
    private final ShoppingListAccessService accessService;
    private final ActiveUsers activeUsers;

    /** Not-found rather than forbidden, so a 403 cannot confirm an id is real. */
    public boolean canView(UUID listId, UUID userId) {
        visibleAccess(listId, userId);
        return true;
    }

    /** Visible and signed in; the services refine owner-only actions with their own messages. */
    public boolean canWrite(UUID listId, UUID userId) {
        return canWrite(listId, userId, access -> true);
    }

    public boolean canCheckItems(UUID listId, UUID userId) {
        return canWrite(listId, userId, ListAccess::canCheck);
    }

    public boolean canEditItems(UUID listId, UUID userId) {
        return canWrite(listId, userId, ListAccess::canEditItems);
    }

    /** Anonymous callers cap at VIEW, so every write stays attributable. */
    public void requireWriteUser(UUID userId) {
        if (userId == null) {
            throw new UnauthorizedException("error.shoppingList.signInToChange");
        }

        activeUsers.requireActive(userId);
    }

    private boolean canWrite(UUID listId, UUID userId, Predicate<ListAccess> allowed) {
        ListAccess access = visibleAccess(listId, userId);
        requireWriteUser(userId);

        if (!allowed.test(access)) {
            throw new ForbiddenException("error.shoppingList.insufficientAccess");
        }

        return true;
    }

    private ListAccess visibleAccess(UUID listId, UUID userId) {
        ListAccess access = lists.findSharingById(listId)
                .map(sharing -> accessService.resolve(sharing, userId))
                .orElse(ListAccess.NONE);

        if (!access.canView()) {
            throw new NotFoundException("error.shoppingList.notFound");
        }

        return access;
    }
}
