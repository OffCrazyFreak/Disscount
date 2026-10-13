package disscount.digitalCard.service;

import java.util.UUID;

final class PhotoKeys {

    private PhotoKeys() {}

    static String userPrefix(UUID userId) {
        return "cards/" + userId + "/";
    }

    static String cardPrefix(UUID userId, UUID cardId) {
        return userPrefix(userId) + cardId + "/";
    }

    /** Unique per upload, so a queued delete of an earlier upload of the same bytes can never hit this one. */
    static String newUploadId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    static String fullKey(UUID userId, UUID cardId, String slot, String sha256, String uploadId, String extension) {
        return cardPrefix(userId, cardId) + slot + "-" + sha256 + "-" + uploadId + "." + extension;
    }

    static String thumbKey(UUID userId, UUID cardId, String slot, String sha256, String uploadId, String extension) {
        return cardPrefix(userId, cardId) + slot + "-" + sha256 + "-" + uploadId + "-thumb." + extension;
    }
}
