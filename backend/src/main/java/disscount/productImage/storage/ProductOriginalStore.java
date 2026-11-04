package disscount.productImage.storage;

import java.util.Optional;

import disscount.digitalCard.storage.StoredPhoto;

/**
 * The untouched uploads every crop renders from. A type of its own rather than a second
 * {@code PhotoStore} bean, so card code can never be handed these files, nor product code the card photos.
 */
public interface ProductOriginalStore {

    /** Keys start with this folder, and on disk it is the switch: without it uploads answer 503. */
    String ROOT_FOLDER = "product-originals";

    boolean enabled();

    void put(String key, byte[] bytes, String contentType);

    Optional<StoredPhoto> get(String key);
}
