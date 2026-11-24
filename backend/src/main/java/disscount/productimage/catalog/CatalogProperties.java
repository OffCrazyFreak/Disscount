package disscount.productimage.catalog;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties("product-images.catalog")
record CatalogProperties(@DefaultValue("https://api.cijene.dev/v0/list") String listUrl) {
}
