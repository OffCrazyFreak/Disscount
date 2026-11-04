package disscount.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;

class PhotoStoreConfigTest {

    static final String ENDPOINT = "https://account.eu.r2.cloudflarestorage.com";
    static final String URL = "https://images.test/";

    final PhotoStoreConfig config = new PhotoStoreConfig();

    @Test
    void aSetDirectoryWinsOverR2EvenWithoutItsFolder(@TempDir Path directory) {
        PhotoStore store = config.photoStore(directory.toString(), ENDPOINT, "bucket", "key", "secret");
        assertThat(store).isInstanceOf(FilesystemPhotoStore.class);
        assertThat(store.enabled()).isFalse();
    }

    @Test
    void aBlankDirectoryKeepsR2() throws Exception {
        PhotoStore store = config.productImageStore("", ENDPOINT, "bucket", "key", "secret", URL);
        assertThat(store).isInstanceOf(R2PhotoStore.class);
        assertThat(store.publicUrl("products/1/a.webp")).isEqualTo("https://images.test/products/1/a.webp");
        ((R2PhotoStore) store).close();
    }

    @Test
    void nothingSetIsDisabled() {
        assertThat(config.photoStore("", "", "", "", "")).isInstanceOf(DisabledPhotoStore.class);
        assertThat(config.productOriginalStore("", "", "", "", "").get("product-originals/1/a.jpg")).isEmpty();
    }

    @Test
    void publicPhotosWithoutAPublicUrlAreOff(@TempDir Path directory) {
        assertThat(config.productImageStore(directory.toString(), ENDPOINT, "bucket", "key", "secret", ""))
                .isInstanceOf(DisabledPhotoStore.class);
    }

    @Test
    void eachFolderSwitchesOnlyItsOwnStore(@TempDir Path directory) throws IOException {
        String dir = directory.toString();
        PhotoStore cards = config.photoStore(dir, "", "", "", "");
        PhotoStore originals = config.productOriginalStore(dir, "", "", "", "");
        PhotoStore products = config.productImageStore(dir, "", "", "", "", URL);

        Files.createDirectory(directory.resolve(PhotoStoreConfig.CARD_FOLDER));
        assertThat(List.of(cards.enabled(), originals.enabled(), products.enabled())).containsExactly(true, false, false);
        Files.delete(directory.resolve(PhotoStoreConfig.CARD_FOLDER));
        Files.createDirectory(directory.resolve(PhotoStoreConfig.ORIGINALS_FOLDER));
        assertThat(List.of(cards.enabled(), originals.enabled(), products.enabled())).containsExactly(false, true, false);
        Files.delete(directory.resolve(PhotoStoreConfig.ORIGINALS_FOLDER));
        Files.createDirectory(directory.resolve(PhotoStoreConfig.PRODUCTS_FOLDER));
        assertThat(List.of(cards.enabled(), originals.enabled(), products.enabled())).containsExactly(false, false, true);
    }
}
