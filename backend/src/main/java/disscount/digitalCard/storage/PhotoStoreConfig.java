package disscount.digitalCard.storage;

import java.nio.file.Path;

import disscount.storage.R2Clients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PhotoStoreConfig {

    // A set directory always wins, even when its folder is missing: falling back to R2 would split photos across two stores.
    @Bean
    PhotoStore photoStore(
            @Value("${photos.private-dir:}") String privateDirectory,
            @Value("${r2.endpoint:}") String endpoint,
            @Value("${r2.bucket:}") String bucket,
            @Value("${r2.access-key-id:}") String accessKeyId,
            @Value("${r2.secret-access-key:}") String secretAccessKey
    ) {
        if (!privateDirectory.isBlank()) {
            return new FilesystemPhotoStore(Path.of(privateDirectory), PhotoStore.ROOT_FOLDER,
                    "error.cardPhoto.unavailable");
        }
        if (R2Clients.anyBlank(endpoint, bucket, accessKeyId, secretAccessKey)) {
            return new DisabledPhotoStore();
        }
        return new R2PhotoStore(R2Clients.create(endpoint, accessKeyId, secretAccessKey), bucket);
    }
}
