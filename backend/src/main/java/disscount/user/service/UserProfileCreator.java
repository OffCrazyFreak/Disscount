package disscount.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import disscount.user.dao.UserRepository;
import disscount.user.domain.User;

/**
 * The one insert that provisions a profile, in a transaction of its own.
 *
 * <p>Its own bean because REQUIRES_NEW only takes effect through the proxy, and because a
 * failed insert has to leave the caller's transaction usable. Reasoning in `docs/AUTH.md`.
 */
@Service
@RequiredArgsConstructor
public class UserProfileCreator {

    private final UserRepository userRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void create(User user) {
        userRepository.saveAndFlush(user);
    }
}
