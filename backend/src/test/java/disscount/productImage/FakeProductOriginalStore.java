package disscount.productImage;

import java.io.ByteArrayInputStream;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import disscount.digitalCard.storage.StoredPhoto;
import disscount.productImage.storage.ProductOriginalStore;

public class FakeProductOriginalStore implements ProductOriginalStore {

    public final Map<String, byte[]> objects = new ConcurrentHashMap<>();
    public volatile boolean enabled = true;

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
                : Optional.of(new StoredPhoto(new ByteArrayInputStream(bytes), bytes.length, "image/jpeg"));
    }

    @Override
    public void delete(String key) {
        objects.remove(key);
    }
}
