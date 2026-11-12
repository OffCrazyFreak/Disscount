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

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
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
    private final AvatarCleanupService cleanup;
    @Qualifier(PhotoStoreConfig.AVATARS)
    private final PhotoStore store;

    // Below every id in Postgres and H2, which both order uuids by their unsigned bytes.
    private static final UUID BEFORE_ALL = new UUID(0, 0);

    /** Tries every row once per run, in id order; a row that fails waits for the next run. Returns how many settled. */
    int moveAll() {
        if (!store.enabled()) return 0;

        int tried = 0;
        int settled = 0;
        List<UUID> ids = users.findIdsWithDataUriImageAfter(BEFORE_ALL, PageRequest.of(0, BATCH));
        while (!ids.isEmpty()) {
            for (UUID id : ids) {
                tried++;
                if (settle(id)) settled++;
            }
            ids = users.findIdsWithDataUriImageAfter(ids.getLast(), PageRequest.of(0, BATCH));
        }

        if (tried > 0) log.info("Settled {} of {} database avatars", settled, tried);
        return settled;
    }

    /** True once the row holds no data URI any more: moved to a file, or dropped as unreadable. */
    private boolean settle(UUID userId) {
        String dataUri = users.findById(userId).map(User::getImage).orElse(null);
        if (dataUri == null || !dataUri.startsWith("data:")) return false;

        ValidatedPhoto photo;
        try {
            // The card photo caps, as these were accepted under them and the move must not lose anyone's avatar.
            photo = validator.validate(pngAsJpeg(decode(dataUri)));
        } catch (BadRequestException unreadable) {
            // It could not be shown safely, and leaving it would make every run try it again.
            log.warn("Dropped an unreadable database avatar of user {}", userId);
            writer.dropUnreadable(userId, dataUri);
            return true;
        }

        String key = AvatarKeys.newKey(userId, photo.extension());
        try {
            store.put(key, photo.bytes(), photo.contentType());
            if (writer.attachMoved(userId, dataUri, key)) return true;
            discard(key);
        } catch (RuntimeException e) {
            // A full disk or a lock timeout: the row keeps its data URI and the next run tries again.
            log.warn("Could not move the database avatar of user {}: {}", userId, e.getMessage());
            discard(key);
        }
        return false;
    }

    /** Queued, so a delete that fails is retried; the key is never referenced, so the queue deletes it. */
    private void discard(String key) {
        try {
            cleanup.enqueueKey(key);
        } catch (RuntimeException e) {
            log.warn("Could not queue a moved avatar file for deletion: {}", e.getMessage());
        }
    }

    /** Safari once stored PNG avatars (docs/IMAGE-UPLOADS.md), which uploads now refuse; production holds one. */
    private static byte[] pngAsJpeg(byte[] bytes) {
        if (!isPng(bytes)) return bytes;

        try {
            BufferedImage png = ImageIO.read(new ByteArrayInputStream(bytes));
            if (png == null) throw new BadRequestException("error.cardPhoto.invalid");

            // JPEG has no alpha, so a transparent corner turns white instead of black.
            BufferedImage flat = new BufferedImage(png.getWidth(), png.getHeight(), BufferedImage.TYPE_INT_RGB);
            Graphics2D canvas = flat.createGraphics();
            canvas.setColor(Color.WHITE);
            canvas.fillRect(0, 0, flat.getWidth(), flat.getHeight());
            canvas.drawImage(png, 0, 0, null);
            canvas.dispose();

            ByteArrayOutputStream jpeg = new ByteArrayOutputStream();
            ImageIO.write(flat, "jpg", jpeg);
            return jpeg.toByteArray();
        } catch (IOException | RuntimeException e) {
            if (e instanceof BadRequestException bad) throw bad;
            throw new BadRequestException("error.cardPhoto.invalid");
        }
    }

    private static boolean isPng(byte[] d) {
        return d.length > 7 && (d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G';
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
