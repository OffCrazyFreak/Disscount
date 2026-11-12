package disscount.shared.photo;

import java.nio.file.Path;

import disscount.shared.photo.AtomicFileStore.Visibility;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Each store is confined to its folder and injected by qualifier, so card code never gets product originals. */
@Configuration
@EnableConfigurationProperties(PhotoProperties.class)
public class PhotoStoreConfig {

    public static final String CARD_PHOTOS = "photoStore";
    public static final String PRODUCT_ORIGINALS = "productOriginalStore";
    public static final String PRODUCT_PHOTOS = "productImageStore";
    public static final String AVATARS = "avatarStore";

    /** Key prefixes, and on disk each store's switch: without its folder the store is off. */
    public static final String CARD_FOLDER = "cards";
    public static final String ORIGINALS_FOLDER = "product-originals";
    public static final String PRODUCTS_FOLDER = "products";
    public static final String AVATARS_FOLDER = "avatars";

    @Bean(CARD_PHOTOS)
    PhotoStore photoStore(PhotoProperties photos) {
        return create(photos.privateDir(), CARD_FOLDER, Visibility.OWNER_ONLY, "error.cardPhoto.unavailable", null);
    }

    @Bean(PRODUCT_ORIGINALS)
    PhotoStore productOriginalStore(PhotoProperties photos) {
        return create(photos.privateDir(), ORIGINALS_FOLDER, Visibility.OWNER_ONLY, "error.productImage.unavailable", null);
    }

    @Bean(PRODUCT_PHOTOS)
    PhotoStore productImageStore(PhotoProperties photos) {
        if (photos.publicUrl().isBlank()) return new DisabledPhotoStore();

        return create(photos.publicDir(), PRODUCTS_FOLDER, Visibility.WORLD_READABLE, "error.productImage.unavailable",
                photos.publicUrl().replaceAll("/$", ""));
    }

    // Public like product photos (owner, 04.11.2026): random keys keep the URLs unguessable, nginx serves them.
    @Bean(AVATARS)
    PhotoStore avatarStore(PhotoProperties photos) {
        if (photos.publicUrl().isBlank()) return new DisabledPhotoStore();

        return create(photos.publicDir(), AVATARS_FOLDER, Visibility.WORLD_READABLE, "error.avatar.unavailable",
                photos.publicUrl().replaceAll("/$", ""));
    }

    private static PhotoStore create(String directory, String folder, Visibility visibility,
                                     String unavailableMessageKey, String publicUrl) {
        if (directory.isBlank()) return new DisabledPhotoStore();
        return new FilesystemPhotoStore(Path.of(directory), folder, visibility, unavailableMessageKey, publicUrl);
    }
}
