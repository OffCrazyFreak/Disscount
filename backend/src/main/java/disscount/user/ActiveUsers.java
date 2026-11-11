package disscount.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import disscount.user.erasure.ErasureLedgerRepository;

/** What other features may ask about a user: whether the account is live, its row lock, and whether an address was erased. */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ActiveUsers {

    private final UserRepository users;
    private final AuthIdentityDao authIdentities;
    private final ErasureLedgerRepository erasureLedger;

    public boolean isActive(UUID userId) {
        return users.existsById(userId);
    }

    /** For the caller's own id: answers 401 once the account is gone, as the session outlived it. */
    public void requireActive(UUID userId) {
        users.requireActive(userId);
    }

    /** Locks the caller's profile until commit, so a write racing account deletion lands first or is refused. */
    @Transactional
    public void lockActive(UUID userId) {
        users.requireActiveForUpdate(userId);
    }

    /** {@link #lockActive} for work that should quietly do nothing once the account is gone. */
    @Transactional
    public boolean lockIfActive(UUID userId) {
        return users.findByIdForUpdate(userId).isPresent();
    }

    /**
     * For a message sent signed out from this address: locks the profile of the login that uses it, so an erasure
     * of that account either runs after the caller commits, or has committed and this answers true.
     */
    @Transactional
    public boolean isErasedLoginAddress(String email) {
        return authIdentities.findIdByEmail(email)
                .filter(id -> users.findByIdForUpdate(id).isEmpty())
                .filter(erasureLedger::existsById)
                .isPresent();
    }

    public boolean isActiveAdmin(UUID userId) {
        return users.findById(userId)
                .map(user -> user.getAccountType() == AccountType.ADMIN)
                .orElse(false);
    }
}
