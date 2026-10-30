package disscount.digitalCard.storage;

import java.util.Optional;

public interface PhotoStore {

    /** False when object storage is not configured; uploads then answer 503. */
    boolean enabled();

    void put(String key, byte[] bytes, String contentType);

    Optional<StoredPhoto> get(String key);

    void delete(String key);

    void deletePrefix(String prefix);
}
