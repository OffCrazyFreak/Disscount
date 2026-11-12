package disscount.user.avatar;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.UUID;

import disscount.shared.photo.PhotoStoreConfig;

final class AvatarKeys {

    // The file is public, so its name is the only thing keeping it from being guessed (OWASP: random names).
    private static final int RANDOM_BYTES = 16;

    private static final SecureRandom RANDOM = new SecureRandom();

    private AvatarKeys() {}

    static String userPrefix(UUID userId) {
        return PhotoStoreConfig.AVATARS_FOLDER + "/" + userId + "/";
    }

    /** A fresh name per upload, so a cached copy of an earlier avatar never shows under the new URL. */
    static String newKey(UUID userId, String extension) {
        byte[] random = new byte[RANDOM_BYTES];
        RANDOM.nextBytes(random);

        return userPrefix(userId) + HexFormat.of().formatHex(random) + "." + extension;
    }
}
