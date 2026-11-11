package disscount.shared.photo;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import disscount.shared.errors.ServiceUnavailableException;

class FilesystemPhotoStoreTest {

    @TempDir Path directory;
    FilesystemPhotoStore store;

    @BeforeEach
    void setUp() throws IOException {
        Files.createDirectory(directory.resolve("cards"));
        store = new FilesystemPhotoStore(directory, "cards", AtomicFileStore.Visibility.OWNER_ONLY,
                "error.cardPhoto.unavailable", null);
    }

    @Test
    void returnsWhatItStoredWithTheTypeFromTheExtension() throws IOException {
        store.put("cards/u/c/front.webp", new byte[]{1, 2}, "image/webp");
        store.put("cards/u/c/back.jpg", new byte[]{3}, "image/jpeg");

        try (StoredPhoto webp = store.get("cards/u/c/front.webp").orElseThrow();
             StoredPhoto jpeg = store.get("cards/u/c/back.jpg").orElseThrow()) {
            assertThat(webp.contentType()).isEqualTo("image/webp");
            assertThat(webp.contentLength()).isEqualTo(2);
            assertThat(webp.stream().readAllBytes()).containsExactly(1, 2);
            assertThat(jpeg.contentType()).isEqualTo("image/jpeg");
        }
    }

    @Test
    void aMissIsEmptyAndADeleteRepeats() {
        assertThat(store.get("cards/u/c/none.jpg")).isEmpty();

        store.put("cards/u/c/a.jpg", new byte[]{1}, "image/jpeg");
        store.delete("cards/u/c/a.jpg");
        store.delete("cards/u/c/a.jpg");

        assertThat(store.get("cards/u/c/a.jpg")).isEmpty();
    }

    @Test
    void erasingAPrefixLeavesOtherUsers() {
        store.put("cards/u1/c/a.jpg", new byte[]{1}, "image/jpeg");
        store.put("cards/u2/c/a.jpg", new byte[]{2}, "image/jpeg");

        store.deletePrefix("cards/u1/");

        assertThat(store.get("cards/u1/c/a.jpg")).isEmpty();
        assertThat(store.get("cards/u2/c/a.jpg")).isPresent();
    }

    @Test
    void aWriteFailureAnswersTheCallersUnavailableMessage() throws IOException {
        Files.writeString(directory.resolve("cards/blocker"), "a file where a directory has to go");

        assertThatThrownBy(() -> store.put("cards/blocker/a.jpg", new byte[]{1}, "image/jpeg"))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessage("error.cardPhoto.unavailable");
    }

    @Test
    void cannotReachTheProductOriginalsNextToIt() throws IOException {
        Files.createDirectories(directory.resolve("product-originals/1"));
        Files.writeString(directory.resolve("product-originals/1/a.jpg"), "original");

        assertThatThrownBy(() -> store.get("product-originals/1/a.jpg")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> store.deletePrefix("product-originals/")).isInstanceOf(IllegalArgumentException.class);
        assertThat(directory.resolve("product-originals/1/a.jpg")).exists();
    }

    @Test
    void isOffWithoutItsFolderAndOnAsSoonAsItExists() throws IOException {
        FilesystemPhotoStore unmounted = new FilesystemPhotoStore(directory, "other", AtomicFileStore.Visibility.OWNER_ONLY,
                "error.cardPhoto.unavailable", null);
        assertThat(unmounted.enabled()).isFalse();

        Files.createDirectory(directory.resolve("other"));
        assertThat(unmounted.enabled()).isTrue();
    }

    @Test
    void aPublicFolderWritesFilesTheWebServerCanReadAndBuildsTheirUrl() throws IOException {
        Files.createDirectory(directory.resolve("products"));
        FilesystemPhotoStore products = new FilesystemPhotoStore(directory, "products",
                AtomicFileStore.Visibility.WORLD_READABLE, "error.productImage.unavailable", "https://images.test");
        products.put("products/1/hash.webp", new byte[]{1}, "image/webp");
        assertThat(PosixFilePermissions.toString(Files.getPosixFilePermissions(directory.resolve("products/1/hash.webp"))))
                .isEqualTo("rw-r--r--");
        assertThat(products.publicUrl("products/1/hash.webp")).isEqualTo("https://images.test/products/1/hash.webp");
        assertThat(store.publicUrl("cards/u/c/a.jpg")).isNull();
    }
}
