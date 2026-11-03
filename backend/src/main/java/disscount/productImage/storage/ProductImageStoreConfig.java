package disscount.productImage.storage;

import java.nio.file.Path;

import disscount.storage.R2Clients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProductImageStoreConfig {

    // The hostname stays the same across the move, so the public URL setting serves both stores.
    @Bean
    ProductImageStore productImageStore(
            @Value("${photos.public-dir:}") String publicDirectory,
            @Value("${r2.endpoint:}") String endpoint,
            @Value("${r2.public-bucket:}") String bucket,
            @Value("${r2.public-access-key-id:}") String accessKeyId,
            @Value("${r2.public-secret-access-key:}") String secretAccessKey,
            @Value("${r2.public-url:}") String publicUrl
    ) {
        if (!publicDirectory.isBlank()) {
            return publicUrl.isBlank()
                    ? new DisabledProductImageStore()
                    : new FilesystemProductImageStore(Path.of(publicDirectory), publicUrl);
        }
        if (R2Clients.anyBlank(endpoint, bucket, accessKeyId, secretAccessKey, publicUrl)) {
            return new DisabledProductImageStore();
        }
        return new R2ProductImageStore(R2Clients.create(endpoint, accessKeyId, secretAccessKey), bucket, publicUrl);
    }
}
