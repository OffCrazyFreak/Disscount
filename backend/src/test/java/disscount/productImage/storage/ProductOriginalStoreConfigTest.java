package disscount.productImage.storage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class ProductOriginalStoreConfigTest {

    final ProductOriginalStoreConfig config = new ProductOriginalStoreConfig();

    @ParameterizedTest
    @ValueSource(ints = {0, 1, 2, 3})
    void anyBlankValueSwitchesTheOriginalsBucketOff(int blank) {
        String[] values = {"https://account.eu.r2.cloudflarestorage.com", "originals", "key", "secret"};
        values[blank] = " ";

        ProductOriginalStore store = config.productOriginalStore(values[0], values[1], values[2], values[3]);

        assertThat(store).isInstanceOf(DisabledProductOriginalStore.class);
        assertThat(store.enabled()).isFalse();
    }

    @Test
    void everyValueSetGivesTheR2Bucket() throws Exception {
        ProductOriginalStore store = config.productOriginalStore(
                "https://account.eu.r2.cloudflarestorage.com", "originals", "key", "secret");

        assertThat(store.enabled()).isTrue();
        ((R2ProductOriginalStore) store).close();
    }
}
