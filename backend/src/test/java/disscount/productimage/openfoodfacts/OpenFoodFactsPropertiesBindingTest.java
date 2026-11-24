package disscount.productimage.openfoodfacts;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;

class OpenFoodFactsPropertiesBindingTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withBean(ObjectMapper.class, ObjectMapper::new)
            .withUserConfiguration(OpenFoodFactsClient.class);

    @Test
    void bothUrlsBindFromTheirKeys() {
        runner.withPropertyValues(
                        "product-images.off.api-base=https://off.test",
                        "product-images.off.export-url=https://off.test/export.csv.gz")
                .run(context -> assertThat(context.getBean(OpenFoodFactsProperties.class))
                        .isEqualTo(new OpenFoodFactsProperties("https://off.test", "https://off.test/export.csv.gz")));
    }

    @Test
    void absentUrlsAreOpenFoodFactsItself() {
        runner.run(context -> assertThat(context.getBean(OpenFoodFactsProperties.class)).isEqualTo(new OpenFoodFactsProperties(
                "https://world.openfoodfacts.org",
                "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz")));
    }
}
