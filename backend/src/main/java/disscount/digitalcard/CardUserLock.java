package disscount.digitalcard;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import disscount.user.User;
import disscount.user.UserRepository;

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
