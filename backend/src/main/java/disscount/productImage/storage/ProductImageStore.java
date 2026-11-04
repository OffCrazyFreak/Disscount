package disscount.productImage.storage;

/** The public files behind the image domain; every key it serves is content-addressed and never rewritten. */
public interface ProductImageStore {

    /** Keys start with this folder, and on disk it is the switch: without it product photos are off. */
    String ROOT_FOLDER = "products";

    boolean enabled();

    void put(String key, byte[] bytes, String contentType);

    void delete(String key);

    String publicUrl(String key);
}
