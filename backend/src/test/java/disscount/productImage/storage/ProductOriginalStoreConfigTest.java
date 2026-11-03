package disscount.productImage.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import disscount.digitalCard.storage.PhotoStore;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;

class ProductOriginalStoreConfigTest {

    final ProductOriginalStoreConfig config = new ProductOriginalStoreConfig();

    private ProductOriginalStore onDisk(Path directory) {
        return config.productOriginalStore(directory.toString(), "", "", "", "");
    }

    @Test
    void writesIntoItsOwnFolderBesideTheCards(@TempDir Path directory) throws IOException {
        Files.createDirectory(directory.resolve(ProductOriginalStore.ROOT_FOLDER));
        Files.createDirectory(directory.resolve(PhotoStore.ROOT_FOLDER));

        onDisk(directory).put("product-originals/1/a.jpg", new byte[]{1}, "image/jpeg");

        assertThat(directory.resolve("product-originals/1/a.jpg")).exists();
        assertThat(directory.resolve("cards")).isEmptyDirectory();
    }

    @Test
    void aMissingFolderIsOffWithoutTouchingTheCardFolder(@TempDir Path directory) throws IOException {
        Files.createDirectory(directory.resolve(PhotoStore.ROOT_FOLDER));

        assertThat(onDisk(directory).enabled()).isFalse();
        assertThat(directory.resolve(ProductOriginalStore.ROOT_FOLDER)).doesNotExist();
    }

    @Test
    void onR2ItUsesTheBucketTheOriginalsAreAlreadyIn() throws Exception {
        ProductOriginalStore store = config.productOriginalStore(
                "", "https://account.eu.r2.cloudflarestorage.com", "bucket", "key", "secret");

        assertThat(store.enabled()).isTrue();
        ((PhotoBackedProductOriginalStore) store).close();
    }

    @Test
    void nothingSetIsOff() {
        ProductOriginalStore store = config.productOriginalStore("", "", "", "", "");

        assertThat(store.enabled()).isFalse();
        assertThat(store.get("product-originals/1/a.jpg")).isEmpty();
    }
}
