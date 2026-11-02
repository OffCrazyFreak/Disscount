package disscount.productImage.storage;

/** The public bucket behind the image domain; every key it serves is content-addressed and never rewritten. */
public interface ProductImageStore {

    boolean enabled();

    void put(String key, byte[] bytes, String contentType);

    void delete(String key);

    String publicUrl(String key);
}
