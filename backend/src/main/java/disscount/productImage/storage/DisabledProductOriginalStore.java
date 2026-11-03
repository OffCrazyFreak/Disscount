package disscount.productImage.storage;

import java.util.Optional;

import disscount.digitalCard.storage.StoredPhoto;

public class DisabledProductOriginalStore implements ProductOriginalStore {

    @Override
    public boolean enabled() {
        return false;
    }

    @Override
    public void put(String key, byte[] bytes, String contentType) {
        throw new UnsupportedOperationException("Product original storage is not configured");
    }

    @Override
    public Optional<StoredPhoto> get(String key) {
        return Optional.empty();
    }

    @Override
    public void delete(String key) {
        // Nothing was ever stored.
    }
}
