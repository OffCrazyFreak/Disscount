package disscount.productimage.catalog;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class CatalogPropertiesBindingTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withBean(JdbcTemplate.class, () -> mock(JdbcTemplate.class))
            .withBean(TransactionTemplate.class, () -> mock(TransactionTemplate.class))
            .withBean(ObjectMapper.class, ObjectMapper::new)
            .withUserConfiguration(CatalogImportService.class);

    @Test
    void theListUrlBindsFromItsKey() {
        runner.withPropertyValues("product-images.catalog.list-url=https://prices.test/v0/list")
                .run(context -> assertThat(context.getBean(CatalogProperties.class).listUrl())
                        .isEqualTo("https://prices.test/v0/list"));
    }

    @Test
    void anAbsentListUrlIsTheCijeneApi() {
        runner.run(context -> assertThat(context.getBean(CatalogProperties.class).listUrl())
                .isEqualTo("https://api.cijene.dev/v0/list"));
    }
}
