package disscount.storage;

import java.nio.file.Path;

import disscount.storage.AtomicFileStore.Visibility;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The three photo stores, each confined to its own folder or bucket and injected by its qualifier,
 * so card code can never be handed product originals, nor product code the card photos.
 */
@Configuration
public class PhotoStoreConfig {

    public static final String CARD_PHOTOS = "photoStore";
    public static final String PRODUCT_ORIGINALS = "productOriginalStore";
    public static final String PRODUCT_PHOTOS = "productImageStore";

    /** Key prefixes, and on disk each store's switch: without its folder the store is off. */
    public static final String CARD_FOLDER = "cards";
    public static final String ORIGINALS_FOLDER = "product-originals";
    public static final String PRODUCTS_FOLDER = "products";

    // Product photo keys carry a hash of their bytes, so a cached copy can never go stale.
    private static final String IMMUTABLE = "public, max-age=31536000, immutable";

    @Bean(CARD_PHOTOS)
    PhotoStore photoStore(
            @Value("${photos.private-dir:}") String directory,
            @Value("${r2.endpoint:}") String endpoint,
            @Value("${r2.bucket:}") String bucket,
            @Value("${r2.access-key-id:}") String accessKeyId,
            @Value("${r2.secret-access-key:}") String secretAccessKey
    ) {
        return create(directory, CARD_FOLDER, Visibility.OWNER_ONLY, "error.cardPhoto.unavailable",
                endpoint, bucket, accessKeyId, secretAccessKey, null, null);
    }

    // On R2 the originals share the card bucket, where they already are, until the move to the server.
    @Bean(PRODUCT_ORIGINALS)
    PhotoStore productOriginalStore(
            @Value("${photos.private-dir:}") String directory,
            @Value("${r2.endpoint:}") String endpoint,
            @Value("${r2.bucket:}") String bucket,
            @Value("${r2.access-key-id:}") String accessKeyId,
            @Value("${r2.secret-access-key:}") String secretAccessKey
    ) {
        return create(directory, ORIGINALS_FOLDER, Visibility.OWNER_ONLY, "error.productImage.unavailable",
                endpoint, bucket, accessKeyId, secretAccessKey, null, null);
    }

    // The hostname stays the same across the move, so the public URL setting serves both kinds of store.
    @Bean(PRODUCT_PHOTOS)
    PhotoStore productImageStore(
            @Value("${photos.public-dir:}") String directory,
            @Value("${r2.endpoint:}") String endpoint,
            @Value("${r2.public-bucket:}") String bucket,
            @Value("${r2.public-access-key-id:}") String accessKeyId,
            @Value("${r2.public-secret-access-key:}") String secretAccessKey,
            @Value("${r2.public-url:}") String publicUrl
    ) {
        if (publicUrl.isBlank()) return new DisabledPhotoStore();
        return create(directory, PRODUCTS_FOLDER, Visibility.WORLD_READABLE, "error.productImage.unavailable",
                endpoint, bucket, accessKeyId, secretAccessKey, IMMUTABLE, publicUrl.replaceAll("/$", ""));
    }

    // A set directory always wins, even when its folder is missing: falling back to R2 would split photos across two stores.
    private static PhotoStore create(String directory, String folder, Visibility visibility, String unavailableMessageKey,
                                     String endpoint, String bucket, String accessKeyId, String secretAccessKey,
                                     String cacheControl, String publicUrl) {
        if (!directory.isBlank()) {
            return new FilesystemPhotoStore(Path.of(directory), folder, visibility, unavailableMessageKey, publicUrl);
        }
        if (R2Clients.anyBlank(endpoint, bucket, accessKeyId, secretAccessKey)) return new DisabledPhotoStore();
        return new R2PhotoStore(R2Clients.create(endpoint, accessKeyId, secretAccessKey), bucket, cacheControl, publicUrl);
    }
}
