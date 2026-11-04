package disscount.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import disscount.user.dao.UserRepository;
import disscount.user.domain.User;

/** Its own bean because REQUIRES_NEW only works through the proxy, and a failed insert must leave the caller's transaction usable (docs/AUTH.md). */
@Service
@RequiredArgsConstructor
public class UserProfileCreator {

    private final UserRepository userRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void create(User user) {
        userRepository.saveAndFlush(user);
    }
}
