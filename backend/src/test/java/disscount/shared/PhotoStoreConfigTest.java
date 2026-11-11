package disscount.shared;

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

    static PhotoProperties privateDir(String directory) {
        return new PhotoProperties(directory, "", "");
    }

    static PhotoProperties publicDir(String directory, String publicUrl) {
        return new PhotoProperties("", directory, publicUrl);
    }

    @Test
    void aSetDirectoryMakesADiskStoreEvenWithoutItsFolder(@TempDir Path directory) {
        PhotoStore store = config.photoStore(privateDir(directory.toString()));
        assertThat(store).isInstanceOf(FilesystemPhotoStore.class);
        assertThat(store.enabled()).isFalse();
    }

    @Test
    void publicPhotosGetTheirUrlWithoutTheTrailingSlash(@TempDir Path directory) {
        PhotoStore store = config.productImageStore(publicDir(directory.toString(), URL));
        assertThat(store.publicUrl("products/1/a.webp")).isEqualTo("https://images.test/products/1/a.webp");
    }

    @Test
    void aBlankDirectoryIsDisabled() {
        assertThat(config.photoStore(privateDir(""))).isInstanceOf(DisabledPhotoStore.class);
        assertThat(config.productOriginalStore(privateDir("")).get("product-originals/1/a.jpg")).isEmpty();
        assertThat(config.productImageStore(publicDir("", URL))).isInstanceOf(DisabledPhotoStore.class);
    }

    @Test
    void publicPhotosWithoutAPublicUrlAreOff(@TempDir Path directory) {
        assertThat(config.productImageStore(publicDir(directory.toString(), ""))).isInstanceOf(DisabledPhotoStore.class);
    }

    @Test
    void eachFolderSwitchesOnlyItsOwnStore(@TempDir Path directory) throws IOException {
        String dir = directory.toString();
        PhotoStore cards = config.photoStore(privateDir(dir));
        PhotoStore originals = config.productOriginalStore(privateDir(dir));
        PhotoStore products = config.productImageStore(publicDir(dir, URL));

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
