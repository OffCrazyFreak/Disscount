package disscount.user;

import java.util.UUID;

/**
 * Published inside the erasure transaction, so a listener that throws rolls the whole erasure back.
 * Listeners set an explicit order because bulk deletes clear the persistence context; AccountErasedListenersTest pins it.
 *
 * @param loginEmail the sign-in address while the login still exists, or null once it is gone
 */
public record AccountErased(UUID userId, String loginEmail) {
}
