package disscount.digitalCard.service;

import disscount.digitalCard.storage.PhotoStore;
import disscount.digitalCard.storage.StoredPhoto;

import java.io.ByteArrayInputStream;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public class FakePhotoStore implements PhotoStore {

    final Map<String, byte[]> objects = new ConcurrentHashMap<>();
    volatile boolean enabled = true;

    @Override
    public boolean enabled() {
        return enabled;
    }

    @Override
    public void put(String key, byte[] bytes, String contentType) {
        objects.put(key, bytes);
    }

    @Override
    public Optional<StoredPhoto> get(String key) {
        byte[] bytes = objects.get(key);
        return bytes == null ? Optional.empty()
                : Optional.of(new StoredPhoto(new ByteArrayInputStream(bytes), bytes.length, "image/webp"));
    }

    @Override
    public void delete(String key) {
        objects.remove(key);
    }

    @Override
    public void deletePrefix(String prefix) {
        objects.keySet().removeIf(k -> k.startsWith(prefix));
    }
}
