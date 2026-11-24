package disscount.user.erasure;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.function.Consumer;

import disscount.user.UserService;

/** Not transactional: the collision below aborts the erasure's own transaction, so it settles outside it. */
@Service
@RequiredArgsConstructor
public class AccountErasureService {

    private final UserService userService;
    private final ErasureLedgerRepository erasureLedger;

    /** DELETE /api/users/me, refused for the last live admin. */
    public void eraseOwnAccount(UUID userId) {
        erase(userId, userService::deleteOwnAccount);
    }

    /** The replay is never refused: a restored backup must forget everyone it is told to, admins included. */
    public void erase(UUID userId) {
        erase(userId, userService::deleteAccount);
    }

    private void erase(UUID userId, Consumer<UUID> deletion) {
        // With a tombstone already there no tombstone is written, so any violation is unrelated.
        boolean couldCollideOnTombstone = !erasureLedger.existsById(userId);
        try {
            deletion.accept(userId);
        } catch (DataIntegrityViolationException collision) {
            // With no profile to lock, a concurrent deletion can commit the tombstone first, and this one is done.
            if (!couldCollideOnTombstone || !erasureLedger.existsById(userId)) throw collision;
        }
    }
}
