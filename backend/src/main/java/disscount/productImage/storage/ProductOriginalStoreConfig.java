package disscount.productImage.storage;

import java.nio.file.Path;

import disscount.digitalCard.storage.DisabledPhotoStore;
import disscount.digitalCard.storage.FilesystemPhotoStore;
import disscount.digitalCard.storage.PhotoStore;
import disscount.digitalCard.storage.R2PhotoStore;
import disscount.storage.R2Clients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProductOriginalStoreConfig {

    @Bean
    ProductOriginalStore productOriginalStore(
            @Value("${photos.private-dir:}") String privateDirectory,
            @Value("${r2.endpoint:}") String endpoint,
            @Value("${r2.bucket:}") String bucket,
            @Value("${r2.access-key-id:}") String accessKeyId,
            @Value("${r2.secret-access-key:}") String secretAccessKey
    ) {
        return new PhotoBackedProductOriginalStore(
                backingStore(privateDirectory, endpoint, bucket, accessKeyId, secretAccessKey));
    }

    // On R2 the originals share the card bucket, where they already are, until the move to the server.
    private static PhotoStore backingStore(String privateDirectory, String endpoint, String bucket,
                                           String accessKeyId, String secretAccessKey) {
        if (!privateDirectory.isBlank()) {
            return new FilesystemPhotoStore(Path.of(privateDirectory), ProductOriginalStore.ROOT_FOLDER,
                    "error.productImage.unavailable");
        }
        if (R2Clients.anyBlank(endpoint, bucket, accessKeyId, secretAccessKey)) {
            return new DisabledPhotoStore();
        }
        return new R2PhotoStore(R2Clients.create(endpoint, accessKeyId, secretAccessKey), bucket);
    }
}
