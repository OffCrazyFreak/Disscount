package disscount.shared.photo;

import java.io.ByteArrayInputStream;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public class FakePhotoStore implements PhotoStore {

    public final Map<String, byte[]> objects = new ConcurrentHashMap<>();
    public volatile boolean enabled = true;
    public volatile boolean failDeletes = false;

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
                : Optional.of(new StoredPhoto(new ByteArrayInputStream(bytes), bytes.length,
                        key.endsWith(".jpg") ? "image/jpeg" : "image/webp"));
    }

    @Override
    public void delete(String key) {
        if (failDeletes) throw new IllegalStateException("storage down");
        objects.remove(key);
    }

    @Override
    public void deletePrefix(String prefix) {
        if (failDeletes) throw new IllegalStateException("storage down");
        objects.keySet().removeIf(k -> k.startsWith(prefix));
    }

    @Override
    public String publicUrl(String key) {
        return key == null ? null : "https://images.test/" + key;
    }
}
