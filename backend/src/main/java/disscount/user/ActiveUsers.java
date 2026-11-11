package disscount.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/** What other features may ask about a user: whether the account is live, and its row lock. */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ActiveUsers {

    private final UserRepository users;

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

    public boolean isActiveAdmin(UUID userId) {
        return users.findById(userId)
                .map(user -> user.getAccountType() == AccountType.ADMIN)
                .orElse(false);
    }
}
