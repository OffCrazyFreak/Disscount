package disscount.user.avatar;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import disscount.shared.FixedWindowLimiter;
import disscount.shared.errors.BadRequestException;
import disscount.shared.errors.ServiceUnavailableException;
import disscount.shared.photo.PhotoStore;
import disscount.shared.photo.PhotoStoreConfig;
import disscount.shared.photo.PhotoValidator;
import disscount.shared.photo.ValidatedPhoto;
import disscount.user.AccountErased;
import disscount.user.User;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AvatarService {

    // Shown at most 96 CSS px and sent as a 256 px square, so these only stop a client that skips its shrink step.
    static final int MAX_BYTES = 256 * 1024;
    static final int MAX_SIDE = 512;

    private static final Logger log = LoggerFactory.getLogger(AvatarService.class);

    private final AvatarWriter writer;
    private final AvatarCleanupService cleanup;
    private final PhotoValidator validator;
    @Qualifier(PhotoStoreConfig.AVATARS)
    private final PhotoStore store;
    @Qualifier(AvatarLimits.UPLOADS)
    private final FixedWindowLimiter rateLimiter;

    /** The uploaded file wins; a profile from before #474 still shows its data URI until the move job reaches it. */
    public String imageUrl(User user) {
        if (user.getAvatarKey() != null) return store.publicUrl(user.getAvatarKey());
        return user.getImage();
    }

    /** No transaction or pooled connection is held while the image is re-encoded or written to disk. */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void upload(UUID userId, MultipartFile file) {
        if (!store.enabled()) throw new ServiceUnavailableException("error.avatar.unavailable");
        rateLimiter.check(userId);

        ValidatedPhoto photo = validator.validate(read(file), MAX_BYTES, MAX_SIDE);
        String key = AvatarKeys.newKey(userId, photo.extension());

        store.put(key, photo.bytes(), photo.contentType());
        try {
            writer.replace(userId, key);
        } catch (RuntimeException e) {
            discard(key);
            throw e;
        }
    }

    @Transactional
    public void remove(UUID userId) {
        writer.remove(userId);
    }

    /** Runs inside the erasure's transaction, after deleteAccount has cleared the profile's key. */
    @EventListener
    @Order(55)
    @Transactional
    public void onAccountErased(AccountErased erased) {
        cleanup.enqueueErasure(AvatarKeys.userPrefix(erased.userId()));
    }

    private void discard(String key) {
        try {
            store.delete(key);
        } catch (RuntimeException e) {
            // Left behind only until the account is erased, whose prefix delete takes it.
            log.warn("Could not discard an avatar file after a failed write: {}", e.getMessage());
        }
    }

    private static byte[] read(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new BadRequestException("error.cardPhoto.empty");
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("error.cardPhoto.unreadable");
        }
    }
}
