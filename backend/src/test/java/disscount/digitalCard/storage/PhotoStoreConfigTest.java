package disscount.digitalCard.storage;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;

class PhotoStoreConfigTest {

    static final String ENDPOINT = "https://account.eu.r2.cloudflarestorage.com";

    final PhotoStoreConfig config = new PhotoStoreConfig();

    @Test
    void aSetDirectoryWinsOverR2(@TempDir Path directory) {
        assertThat(config.photoStore(directory.toString(), ENDPOINT, "bucket", "key", "secret"))
                .isInstanceOf(FilesystemPhotoStore.class);
    }

    @Test
    void aSetDirectoryWithoutItsFolderIsOffRatherThanFallingBackToR2(@TempDir Path directory) {
        PhotoStore store = config.photoStore(directory.toString(), ENDPOINT, "bucket", "key", "secret");

        assertThat(store).isInstanceOf(FilesystemPhotoStore.class);
        assertThat(store.enabled()).isFalse();
    }

    @Test
    void aBlankDirectoryKeepsR2() throws Exception {
        PhotoStore store = config.photoStore("", ENDPOINT, "bucket", "key", "secret");

        assertThat(store).isInstanceOf(R2PhotoStore.class);
        ((R2PhotoStore) store).close();
    }

    @Test
    void nothingSetIsDisabled() {
        assertThat(config.photoStore("", "", "", "", "")).isInstanceOf(DisabledPhotoStore.class);
    }
}
