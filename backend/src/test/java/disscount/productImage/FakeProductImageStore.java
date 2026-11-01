package disscount.productImage;

import java.util.LinkedHashMap;
import java.util.Map;

import disscount.productImage.storage.ProductImageStore;

public class FakeProductImageStore implements ProductImageStore {

    public final Map<String, byte[]> objects = new LinkedHashMap<>();
    public boolean enabled = true;

    @Override
    public boolean enabled() {
        return enabled;
    }

    @Override
    public void put(String key, byte[] bytes, String contentType) {
        objects.put(key, bytes);
    }

    @Override
    public void delete(String key) {
        objects.remove(key);
    }

    @Override
    public String publicUrl(String key) {
        return key == null ? null : "https://images.test/" + key;
    }
}
