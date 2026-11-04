package disscount.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import disscount.user.dao.ErasureLedgerRepository;

import java.util.UUID;

/** Not transactional because the collision below aborts the erasure's own transaction, so it can only be settled outside it. */
@Service
@RequiredArgsConstructor
public class AccountErasureService {

    private final UserService userService;
    private final ErasureLedgerRepository erasureLedger;

    public void erase(UUID userId) {
        // With a tombstone already there no tombstone is written, so any violation is unrelated.
        boolean couldCollideOnTombstone = !erasureLedger.existsById(userId);
        try {
            userService.deleteAccount(userId);
        } catch (DataIntegrityViolationException collision) {
            // An identity with no profile has nothing to lock, so a concurrent deletion can commit the tombstone first, and this one is then done.
            if (!couldCollideOnTombstone || !erasureLedger.existsById(userId)) throw collision;
        }
    }
}
