package disscount.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import disscount.user.dao.ErasureLedgerRepository;

import java.util.UUID;

/**
 * Runs the account erasure for better-auth's deleteUser hook. Not transactional on purpose:
 * the collision below aborts the erasure's own transaction, so it can only be settled outside it.
 */
@Service
@RequiredArgsConstructor
public class AccountErasureService {

    private final UserService userService;
    private final ErasureLedgerRepository erasureLedger;

    public void erase(UUID userId) {
        try {
            userService.deleteAccount(userId);
        } catch (DataIntegrityViolationException collision) {
            // An identity with no profile row has nothing to lock, so a concurrent deletion can
            // commit the tombstone first; its committed erasure is this one, so this one is done.
            if (!erasureLedger.existsById(userId)) throw collision;
        }
    }
}
