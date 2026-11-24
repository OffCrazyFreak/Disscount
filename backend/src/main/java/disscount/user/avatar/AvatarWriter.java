package disscount.user.avatar;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import disscount.user.User;
import disscount.user.UserRepository;

import java.util.Objects;
import java.util.UUID;

/** The profile side of an avatar change, under the account deletion row lock; no file work happens in here. */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class AvatarWriter {

    private final UserRepository users;
    private final AvatarCleanupService cleanup;

    /** The new file is already stored; the provider picture goes too, so removing the upload later shows initials. */
    @Transactional
    public void replace(UUID userId, String newKey) {
        User user = users.requireActiveForUpdate(userId);
        String oldKey = user.getAvatarKey();

        user.setAvatarKey(newKey);
        user.setImage(null);
        users.save(user);

        if (oldKey != null) cleanup.enqueueKey(oldKey);
    }

    /** A cleared avatar stays cleared: the sign-in picture is copied only when the profile is created. */
    @Transactional
    public void remove(UUID userId) {
        User user = users.requireActiveForUpdate(userId);
        String oldKey = user.getAvatarKey();

        user.setAvatarKey(null);
        user.setImage(null);
        users.save(user);

        if (oldKey != null) cleanup.enqueueKey(oldKey);
    }

    /** False when the user changed the avatar meanwhile, so the moved file is no longer wanted. */
    @Transactional
    public boolean attachMoved(UUID userId, String dataUri, String newKey) {
        User user = users.findByIdForUpdate(userId).orElse(null);
        if (user == null || user.getAvatarKey() != null || !Objects.equals(user.getImage(), dataUri)) return false;

        user.setAvatarKey(newKey);
        user.setImage(null);
        users.save(user);
        return true;
    }

    @Transactional
    public void dropUnreadable(UUID userId, String dataUri) {
        users.findByIdForUpdate(userId)
                .filter(user -> Objects.equals(user.getImage(), dataUri))
                .ifPresent(user -> {
                    user.setImage(null);
                    users.save(user);
                });
    }
}
