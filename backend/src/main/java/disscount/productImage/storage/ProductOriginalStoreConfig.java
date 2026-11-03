package disscount.productImage.storage;

import disscount.storage.R2Clients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProductOriginalStoreConfig {

    @Bean
    ProductOriginalStore productOriginalStore(
            @Value("${r2.endpoint:}") String endpoint,
            @Value("${r2.originals-bucket:}") String bucket,
            @Value("${r2.originals-access-key-id:}") String accessKeyId,
            @Value("${r2.originals-secret-access-key:}") String secretAccessKey
    ) {
        if (R2Clients.anyBlank(endpoint, bucket, accessKeyId, secretAccessKey)) {
            return new DisabledProductOriginalStore();
        }
        return new R2ProductOriginalStore(R2Clients.create(endpoint, accessKeyId, secretAccessKey), bucket);
    }
}
