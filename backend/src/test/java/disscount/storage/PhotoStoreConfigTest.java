package disscount.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;

class PhotoStoreConfigTest {

    static final String URL = "https://images.test/";

    final PhotoStoreConfig config = new PhotoStoreConfig();

    @Test
    void aSetDirectoryMakesADiskStoreEvenWithoutItsFolder(@TempDir Path directory) {
        PhotoStore store = config.photoStore(directory.toString());
        assertThat(store).isInstanceOf(FilesystemPhotoStore.class);
        assertThat(store.enabled()).isFalse();
    }

    @Test
    void publicPhotosGetTheirUrlWithoutTheTrailingSlash(@TempDir Path directory) {
        PhotoStore store = config.productImageStore(directory.toString(), URL);
        assertThat(store.publicUrl("products/1/a.webp")).isEqualTo("https://images.test/products/1/a.webp");
    }

    @Test
    void aBlankDirectoryIsDisabled() {
        assertThat(config.photoStore("")).isInstanceOf(DisabledPhotoStore.class);
        assertThat(config.productOriginalStore("").get("product-originals/1/a.jpg")).isEmpty();
        assertThat(config.productImageStore("", URL)).isInstanceOf(DisabledPhotoStore.class);
    }

    @Test
    void publicPhotosWithoutAPublicUrlAreOff(@TempDir Path directory) {
        assertThat(config.productImageStore(directory.toString(), "")).isInstanceOf(DisabledPhotoStore.class);
    }

    @Test
    void eachFolderSwitchesOnlyItsOwnStore(@TempDir Path directory) throws IOException {
        String dir = directory.toString();
        PhotoStore cards = config.photoStore(dir);
        PhotoStore originals = config.productOriginalStore(dir);
        PhotoStore products = config.productImageStore(dir, URL);

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
