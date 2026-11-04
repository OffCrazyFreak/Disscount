package disscount.productImage.storage;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;

class ProductImageStoreConfigTest {

    static final String ENDPOINT = "https://account.eu.r2.cloudflarestorage.com";
    static final String URL = "https://images.test";

    final ProductImageStoreConfig config = new ProductImageStoreConfig();

    @Test
    void aSetDirectoryWinsOverR2(@TempDir Path directory) {
        assertThat(config.productImageStore(directory.toString(), ENDPOINT, "bucket", "key", "secret", URL))
                .isInstanceOf(FilesystemProductImageStore.class);
    }

    @Test
    void aSetDirectoryWithoutAPublicUrlIsOff(@TempDir Path directory) {
        assertThat(config.productImageStore(directory.toString(), "", "", "", "", ""))
                .isInstanceOf(DisabledProductImageStore.class);
    }

    @Test
    void aBlankDirectoryKeepsR2() {
        ProductImageStore store = config.productImageStore("", ENDPOINT, "bucket", "key", "secret", URL);

        assertThat(store).isInstanceOf(R2ProductImageStore.class);
        ((R2ProductImageStore) store).close();
    }

    @Test
    void nothingSetIsDisabled() {
        assertThat(config.productImageStore("", "", "", "", "", "")).isInstanceOf(DisabledProductImageStore.class);
    }
}
