package disscount.shared.photo;

import java.util.Optional;

class DisabledPhotoStore implements PhotoStore {

    @Override
    public boolean enabled() {
        return false;
    }

    @Override
    public void put(String key, byte[] bytes, String contentType) {
        throw new UnsupportedOperationException("Photo storage is not configured");
    }

    @Override
    public Optional<StoredPhoto> get(String key) {
        return Optional.empty();
    }

    @Override
    public void delete(String key) {}

    @Override
    public void deletePrefix(String prefix) {}

    @Override
    public String publicUrl(String key) {
        return null;
    }
}
