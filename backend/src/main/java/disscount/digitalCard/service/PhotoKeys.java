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

    static String fullKey(UUID userId, UUID cardId, String slot, String sha256, String extension) {
        return cardPrefix(userId, cardId) + slot + "-" + sha256 + "." + extension;
    }

    static String thumbKey(UUID userId, UUID cardId, String slot, String sha256, String extension) {
        return cardPrefix(userId, cardId) + slot + "-" + sha256 + "-thumb." + extension;
    }
}
