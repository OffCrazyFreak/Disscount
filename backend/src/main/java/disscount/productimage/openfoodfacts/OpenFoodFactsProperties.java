package disscount.productimage.openfoodfacts;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties("product-images.off")
record OpenFoodFactsProperties(
        @DefaultValue("https://world.openfoodfacts.org") String apiBase,
        @DefaultValue("https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz") String exportUrl
) {
}
