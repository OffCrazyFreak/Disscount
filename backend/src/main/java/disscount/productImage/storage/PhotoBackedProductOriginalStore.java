package disscount.productImage.storage;

import java.util.Optional;

import disscount.digitalCard.storage.PhotoStore;
import disscount.digitalCard.storage.StoredPhoto;

/** Object handling is the same as for card photos; this instance is never a bean, so only product code reaches it. */
public class PhotoBackedProductOriginalStore implements ProductOriginalStore, AutoCloseable {

    private final PhotoStore photos;

    public PhotoBackedProductOriginalStore(PhotoStore photos) {
        this.photos = photos;
    }

    @Override
    public boolean enabled() {
        return photos.enabled();
    }

    @Override
    public void put(String key, byte[] bytes, String contentType) {
        photos.put(key, bytes, contentType);
    }

    @Override
    public Optional<StoredPhoto> get(String key) {
        return photos.get(key);
    }

    @Override
    public void close() throws Exception {
        if (photos instanceof AutoCloseable closeable) closeable.close();
    }
}
