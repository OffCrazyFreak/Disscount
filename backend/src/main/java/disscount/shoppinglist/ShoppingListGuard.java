package disscount.shoppinglist;

import disscount.shared.UnauthorizedException;
import disscount.user.ActiveUsers;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/** Who may do what to a shopping list (docs/SHARING.md). */
@Component
@RequiredArgsConstructor
public class ShoppingListGuard {

    private final ActiveUsers activeUsers;

    /** Anonymous callers cap at VIEW, so every write stays attributable. */
    public void requireWriteUser(UUID userId) {
        if (userId == null) {
            throw new UnauthorizedException("error.shoppingList.signInToChange");
        }

        activeUsers.requireActive(userId);
    }
}
