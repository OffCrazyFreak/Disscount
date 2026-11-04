package disscount.digitalCard.storage;

import java.util.Optional;

public interface PhotoStore {

    /** Keys start with this folder, and on disk it is the switch: without it uploads answer 503. */
    String ROOT_FOLDER = "cards";

    /** False when storage is off; uploads then answer 503. */
    boolean enabled();

    void put(String key, byte[] bytes, String contentType);

    Optional<StoredPhoto> get(String key);

    void delete(String key);

    void deletePrefix(String prefix);
}
