package disscount.productImage.storage;

public class DisabledProductImageStore implements ProductImageStore {

    @Override
    public boolean enabled() {
        return false;
    }

    @Override
    public void put(String key, byte[] bytes, String contentType) {
        throw new UnsupportedOperationException("Product image storage is not configured");
    }

    @Override
    public void delete(String key) {
        // Nothing was ever stored.
    }

    @Override
    public String publicUrl(String key) {
        return null;
    }
}
