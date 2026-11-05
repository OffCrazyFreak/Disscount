package disscount.digitalCard.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import disscount.user.dao.UserRepository;
import disscount.user.domain.User;

import java.util.UUID;

/** Serializes card writes so cap, replayed PUT and racing delete see commits; call first in the transaction. */
@Component
@RequiredArgsConstructor
public class CardUserLock {

    private final UserRepository userRepository;

    public User acquire(UUID userId) {
        return userRepository.requireActiveForUpdate(userId);
    }
}
