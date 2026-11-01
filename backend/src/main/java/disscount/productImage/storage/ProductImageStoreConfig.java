package disscount.productImage.storage;

import disscount.storage.R2Clients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProductImageStoreConfig {

    @Bean
    ProductImageStore productImageStore(
            @Value("${r2.endpoint:}") String endpoint,
            @Value("${r2.public-bucket:}") String bucket,
            @Value("${r2.public-access-key-id:}") String accessKeyId,
            @Value("${r2.public-secret-access-key:}") String secretAccessKey,
            @Value("${r2.public-url:}") String publicUrl
    ) {
        if (R2Clients.anyBlank(endpoint, bucket, accessKeyId, secretAccessKey, publicUrl)) {
            return new DisabledProductImageStore();
        }
        return new R2ProductImageStore(R2Clients.create(endpoint, accessKeyId, secretAccessKey), bucket, publicUrl);
    }
}
