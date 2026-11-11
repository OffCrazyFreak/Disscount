package disscount.productimage;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties("product-images.jobs")
record ProductImageJobProperties(@DefaultValue("true") boolean enabled) {
}
