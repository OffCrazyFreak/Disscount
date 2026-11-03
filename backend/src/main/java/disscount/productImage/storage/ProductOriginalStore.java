package disscount.productImage.storage;

import java.util.Optional;

import disscount.digitalCard.storage.StoredPhoto;

/**
 * The private bucket holding the untouched uploads that every crop renders from. A type of its own, not a
 * second card photo store, so card code can never be handed this bucket or its credentials, nor the reverse.
 */
public interface ProductOriginalStore {

    /** False when the originals bucket is not configured; uploads then answer 503. */
    boolean enabled();

    void put(String key, byte[] bytes, String contentType);

    Optional<StoredPhoto> get(String key);

    void delete(String key);
}
