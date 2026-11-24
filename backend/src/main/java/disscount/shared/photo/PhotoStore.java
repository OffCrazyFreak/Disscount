package disscount.shared.photo;

import java.util.Optional;

public interface PhotoStore {

    /** False when storage is off; uploads then answer 503. */
    boolean enabled();

    void put(String key, byte[] bytes, String contentType);

    Optional<StoredPhoto> get(String key);

    void delete(String key);

    void deletePrefix(String prefix);

    /** Null on a private store. */
    String publicUrl(String key);
}
