package disscount.digitalCard.storage;

import disscount.storage.R2Clients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PhotoStoreConfig {

    @Bean
    PhotoStore photoStore(
            @Value("${r2.endpoint:}") String endpoint,
            @Value("${r2.bucket:}") String bucket,
            @Value("${r2.access-key-id:}") String accessKeyId,
            @Value("${r2.secret-access-key:}") String secretAccessKey
    ) {
        if (R2Clients.anyBlank(endpoint, bucket, accessKeyId, secretAccessKey)) {
            return new DisabledPhotoStore();
        }
        return new R2PhotoStore(R2Clients.create(endpoint, accessKeyId, secretAccessKey), bucket);
    }
}
