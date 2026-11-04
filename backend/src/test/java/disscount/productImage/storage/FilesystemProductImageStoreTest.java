package disscount.productImage.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;

import disscount.exceptions.ServiceUnavailableException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FilesystemProductImageStoreTest {

    @TempDir Path directory;

    private FilesystemProductImageStore store() throws IOException {
        Files.createDirectories(directory.resolve("products"));
        return new FilesystemProductImageStore(directory, "https://images.test/");
    }

    @Test
    void storesAFileTheWebServerCanRead() throws IOException {
        store().put("products/1/hash.jpg", new byte[]{1}, "image/jpeg");

        assertThat(directory.resolve("products/1/hash.jpg")).hasBinaryContent(new byte[]{1});
        assertThat(PosixFilePermissions.toString(Files.getPosixFilePermissions(directory.resolve("products/1/hash.jpg"))))
                .isEqualTo("rw-r--r--");
    }

    @Test
    void buildsTheUrlFromTheKey() throws IOException {
        assertThat(store().publicUrl("products/1/hash.jpg")).isEqualTo("https://images.test/products/1/hash.jpg");
    }

    @Test
    void deleteRepeatsAndWriteFailuresAreUnavailable() throws IOException {
        FilesystemProductImageStore store = store();
        store.put("products/1/hash.jpg", new byte[]{1}, "image/jpeg");
        store.delete("products/1/hash.jpg");
        store.delete("products/1/hash.jpg");
        Files.writeString(directory.resolve("products/blocker"), "a file where a directory has to go");

        assertThatThrownBy(() -> store.put("products/blocker/a.jpg", new byte[]{1}, "image/jpeg"))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessage("error.productImage.unavailable");
    }

    @Test
    void isOffWithoutItsFolderSoPublicReadsAnswerEmpty() {
        assertThat(new FilesystemProductImageStore(directory, "https://images.test").enabled()).isFalse();
    }
}
