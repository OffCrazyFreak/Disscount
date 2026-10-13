package disscount.digitalCard.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import disscount.exceptions.UnauthorizedException;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;

import java.util.UUID;

/**
 * Serializes every card write of one user on the app_user row, so the card cap, a replayed PUT
 * and a photo write racing a delete each see the other's committed result. Call it first in the
 * transaction: the lock lasts until commit.
 */
@Component
@RequiredArgsConstructor
public class CardUserLock {

    private final UserRepository userRepository;

    public User acquire(UUID userId) {
        return userRepository.findByIdForUpdate(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new UnauthorizedException("error.user.notFound"));
    }
}
