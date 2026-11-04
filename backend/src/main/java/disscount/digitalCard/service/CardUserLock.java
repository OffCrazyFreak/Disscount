package disscount.digitalCard.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import disscount.user.dao.UserRepository;
import disscount.user.domain.User;

import java.util.UUID;

/** Serializes a user's card writes so the cap, a replayed PUT and a racing delete see committed results; call first in the transaction. */
@Component
@RequiredArgsConstructor
public class CardUserLock {

    private final UserRepository userRepository;

    public User acquire(UUID userId) {
        return userRepository.requireActiveForUpdate(userId);
    }
}
