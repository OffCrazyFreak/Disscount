package disscount.user;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.UUID;

/** Not transactional: the collision below aborts the erasure's own transaction, so it settles outside it. */
@Service
@RequiredArgsConstructor
class AccountErasureService {

    private final UserService userService;
    private final ErasureLedgerRepository erasureLedger;

    public void erase(UUID userId) {
        // With a tombstone already there no tombstone is written, so any violation is unrelated.
        boolean couldCollideOnTombstone = !erasureLedger.existsById(userId);
        try {
            userService.deleteAccount(userId);
        } catch (DataIntegrityViolationException collision) {
            // With no profile to lock, a concurrent deletion can commit the tombstone first, and this one is done.
            if (!couldCollideOnTombstone || !erasureLedger.existsById(userId)) throw collision;
        }
    }
}
