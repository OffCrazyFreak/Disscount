package disscount.user.avatar;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import disscount.shared.errors.BadRequestException;
import disscount.shared.photo.PhotoStore;
import disscount.shared.photo.PhotoStoreConfig;
import disscount.shared.photo.PhotoValidator;
import disscount.shared.photo.ValidatedPhoto;
import disscount.user.User;
import disscount.user.UserRepository;

import java.util.Base64;
import java.util.List;
import java.util.UUID;

/** Moves avatars stored as data URIs before #474 into files; safe to run again, and idle once none are left. */
@Component
@RequiredArgsConstructor
class DataUriAvatarMove {

    private static final int BATCH = 50;
    private static final String BASE64_MARKER = ";base64,";

    private static final Logger log = LoggerFactory.getLogger(DataUriAvatarMove.class);

    private final UserRepository users;
    private final AvatarWriter writer;
    private final PhotoValidator validator;
    @Qualifier(PhotoStoreConfig.AVATARS)
    private final PhotoStore store;

    /** One batch per call; returns how many avatars became files. */
    int moveBatch() {
        if (!store.enabled()) return 0;

        List<UUID> ids = users.findIdsWithDataUriImage(PageRequest.of(0, BATCH));
        int moved = 0;
        for (UUID id : ids) {
            if (moveOne(id)) moved++;
        }
        if (!ids.isEmpty()) log.info("Moved {} of {} database avatars to files", moved, ids.size());
        return moved;
    }

    private boolean moveOne(UUID userId) {
        String dataUri = users.findById(userId).map(User::getImage).orElse(null);
        if (dataUri == null || !dataUri.startsWith("data:")) return false;

        ValidatedPhoto photo;
        try {
            // The card photo caps, as these were accepted under them and the move must not lose anyone's avatar.
            photo = validator.validate(decode(dataUri));
        } catch (BadRequestException unreadable) {
            // It could not be shown safely, and leaving it would make every run try it again.
            log.warn("Dropped an unreadable database avatar of user {}", userId);
            writer.dropUnreadable(userId, dataUri);
            return false;
        }

        String key = AvatarKeys.newKey(userId, photo.extension());
        try {
            store.put(key, photo.bytes(), photo.contentType());
            if (writer.attachMoved(userId, dataUri, key)) return true;
            store.delete(key);
        } catch (RuntimeException e) {
            // A full disk or a lock timeout: the row keeps its data URI and the next run tries again.
            log.warn("Could not move the database avatar of user {}: {}", userId, e.getMessage());
            deleteQuietly(key);
        }
        return false;
    }

    private void deleteQuietly(String key) {
        try {
            store.delete(key);
        } catch (RuntimeException ignored) {
            // The account's prefix delete at erasure still reaches it.
        }
    }

    private static byte[] decode(String dataUri) {
        int marker = dataUri.indexOf(BASE64_MARKER);
        if (marker < 0) throw new BadRequestException("error.cardPhoto.invalid");
        try {
            return Base64.getDecoder().decode(dataUri.substring(marker + BASE64_MARKER.length()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("error.cardPhoto.invalid");
        }
    }
}
