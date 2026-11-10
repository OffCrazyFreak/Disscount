package disscount.shared;

import java.nio.file.Path;

import disscount.shared.AtomicFileStore.Visibility;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Each store is confined to its folder and injected by qualifier, so card code never gets product originals. */
@Configuration
public class PhotoStoreConfig {

    public static final String CARD_PHOTOS = "photoStore";
    public static final String PRODUCT_ORIGINALS = "productOriginalStore";
    public static final String PRODUCT_PHOTOS = "productImageStore";

    /** Key prefixes, and on disk each store's switch: without its folder the store is off. */
    public static final String CARD_FOLDER = "cards";
    public static final String ORIGINALS_FOLDER = "product-originals";
    public static final String PRODUCTS_FOLDER = "products";

    @Bean(CARD_PHOTOS)
    PhotoStore photoStore(@Value("${photos.private-dir:}") String directory) {
        return create(directory, CARD_FOLDER, Visibility.OWNER_ONLY, "error.cardPhoto.unavailable", null);
    }

    @Bean(PRODUCT_ORIGINALS)
    PhotoStore productOriginalStore(@Value("${photos.private-dir:}") String directory) {
        return create(directory, ORIGINALS_FOLDER, Visibility.OWNER_ONLY, "error.productImage.unavailable", null);
    }

    @Bean(PRODUCT_PHOTOS)
    PhotoStore productImageStore(
            @Value("${photos.public-dir:}") String directory,
            @Value("${photos.public-url:}") String publicUrl
    ) {
        if (publicUrl.isBlank()) return new DisabledPhotoStore();
        return create(directory, PRODUCTS_FOLDER, Visibility.WORLD_READABLE, "error.productImage.unavailable",
                publicUrl.replaceAll("/$", ""));
    }

    private static PhotoStore create(String directory, String folder, Visibility visibility,
                                     String unavailableMessageKey, String publicUrl) {
        if (directory.isBlank()) return new DisabledPhotoStore();
        return new FilesystemPhotoStore(Path.of(directory), folder, visibility, unavailableMessageKey, publicUrl);
    }
}
