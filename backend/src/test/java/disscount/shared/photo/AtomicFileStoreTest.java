package disscount.shared.photo;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.List;
import java.util.stream.Stream;

import disscount.shared.photo.AtomicFileStore.Visibility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AtomicFileStoreTest {

    @TempDir Path base;
    AtomicFileStore store;

    @BeforeEach
    void setUp() throws IOException {
        Files.createDirectory(base.resolve("cards"));
        store = new AtomicFileStore(base, "cards", Visibility.OWNER_ONLY);
    }

    @Test
    void writesTheFileAtItsKeyAndLeavesNoTemporaryFile() throws IOException {
        store.write("cards/u/c/a.jpg", new byte[]{1, 2, 3});

        assertThat(base.resolve("cards/u/c/a.jpg")).hasBinaryContent(new byte[]{1, 2, 3});
        assertThat(filesUnder(base)).containsExactly(base.resolve("cards/u/c/a.jpg"));
    }

    @Test
    void aSecondWriteReplacesTheWholeFile() throws IOException {
        store.write("cards/u/a.jpg", new byte[]{1, 2, 3});
        store.write("cards/u/a.jpg", new byte[]{9});

        assertThat(base.resolve("cards/u/a.jpg")).hasBinaryContent(new byte[]{9});
    }

    @Test
    void aFailedWriteLeavesNoTemporaryFile() throws IOException {
        Files.createDirectories(base.resolve("cards/u/taken.jpg/occupied"));

        assertThatThrownBy(() -> store.write("cards/u/taken.jpg", new byte[]{1})).isInstanceOf(IOException.class);

        assertThat(filesUnder(base)).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "cards/../secret.jpg", "cards/u/../../secret.jpg", "../secret.jpg", "/etc/passwd", "cards//a.jpg",
            "cards/u/.tmp-1", "cards\\..\\secret.jpg", "cards/u/a.jpg\n", "cards/u/a b.jpg", "cards", "",
            "product-originals/1/a.jpg", "cardsextra/a.jpg"
    })
    void refusesKeysThatEscapeTheFolderOrAreNotPlainPaths(String key) {
        assertThatThrownBy(() -> store.write(key, new byte[]{1})).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> store.open(key)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> store.delete(key)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void aNullKeyIsRefused() {
        assertThatThrownBy(() -> store.open(null)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void openReturnsTheBytesAndSizeAndEmptyOnAMiss() throws IOException {
        store.write("cards/u/a.jpg", new byte[]{1, 2, 3});

        AtomicFileStore.OpenedFile opened = store.open("cards/u/a.jpg").orElseThrow();
        try (var stream = opened.stream()) {
            assertThat(opened.size()).isEqualTo(3);
            assertThat(stream.readAllBytes()).containsExactly(1, 2, 3);
        }
        assertThat(store.open("cards/u/missing.jpg")).isEmpty();
        assertThat(store.open("cards/u")).isEmpty();
    }

    @Test
    void deleteIsIdempotent() throws IOException {
        store.write("cards/u/a.jpg", new byte[]{1});

        store.delete("cards/u/a.jpg");
        store.delete("cards/u/a.jpg");
        store.delete("cards/never/a.jpg");

        assertThat(base.resolve("cards/u/a.jpg")).doesNotExist();
    }

    @Test
    void deletePrefixRemovesOnlyThatTreeAndToleratesAMissingOne() throws IOException {
        store.write("cards/u1/c/a.jpg", new byte[]{1});
        store.write("cards/u1/d/b.jpg", new byte[]{1});
        store.write("cards/u12/c/a.jpg", new byte[]{1});

        store.deletePrefix("cards/u1/");
        store.deletePrefix("cards/u1/");

        assertThat(base.resolve("cards/u1")).doesNotExist();
        assertThat(filesUnder(base)).containsExactly(base.resolve("cards/u12/c/a.jpg"));
    }

    @Test
    void deletePrefixTakesLeftoverTemporaryFilesWithIt() throws IOException {
        store.write("cards/u/a.jpg", new byte[]{1});
        Files.writeString(base.resolve("cards/u/" + AtomicFileStore.TEMP_FILE_PREFIX + "crashed"), "partial");

        store.deletePrefix("cards/u/");

        assertThat(base.resolve("cards/u")).doesNotExist();
    }

    @ParameterizedTest
    @ValueSource(strings = {"cards/", "cards/u", "../", "cards/../", "product-originals/"})
    void deletePrefixRefusesTheWholeFolderAndAnythingOutsideIt(String prefix) {
        assertThatThrownBy(() -> store.deletePrefix(prefix)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void aMissingFolderIsNotCreatedAndWritesFail() throws IOException {
        AtomicFileStore unmounted = new AtomicFileStore(base, "product-originals", Visibility.OWNER_ONLY);

        assertThat(unmounted.isAvailable()).isFalse();
        assertThatThrownBy(() -> unmounted.write("product-originals/1/a.jpg", new byte[]{1}))
                .isInstanceOf(NoSuchFileException.class);
        assertThat(base.resolve("product-originals")).doesNotExist();
        assertThat(unmounted.open("product-originals/1/a.jpg")).isEmpty();
    }

    @Test
    void privateFilesAreOwnerOnlyAndPublicOnesWorldReadable() throws IOException {
        store.write("cards/u/a.jpg", new byte[]{1});
        assertThat(mode(base.resolve("cards/u/a.jpg"))).isEqualTo("rw-------");
        assertThat(mode(base.resolve("cards/u"))).isEqualTo("rwx------");

        Files.createDirectory(base.resolve("products"));
        new AtomicFileStore(base, "products", Visibility.WORLD_READABLE).write("products/1/a.jpg", new byte[]{1});
        assertThat(mode(base.resolve("products/1/a.jpg"))).isEqualTo("rw-r--r--");
        assertThat(mode(base.resolve("products/1"))).isEqualTo("rwxr-xr-x");
    }

    private static String mode(Path path) throws IOException {
        return PosixFilePermissions.toString(Files.getPosixFilePermissions(path));
    }

    private static List<Path> filesUnder(Path root) throws IOException {
        try (Stream<Path> walk = Files.walk(root)) {
            return walk.filter(Files::isRegularFile).toList();
        }
    }
}
