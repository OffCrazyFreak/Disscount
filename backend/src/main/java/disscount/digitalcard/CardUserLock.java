package disscount.digitalcard;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import disscount.user.ActiveUsers;

import java.util.UUID;

/** Serializes card writes so cap, replayed PUT and racing delete see commits; call first in the transaction. */
@Component
@RequiredArgsConstructor
public class CardUserLock {

    private final ActiveUsers activeUsers;

    public void acquire(UUID userId) {
        activeUsers.lockActive(userId);
    }
}
