package disscount.digitalcard.photo;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import disscount.shared.photo.AtomicFileStore;
import disscount.shared.photo.FilesystemPhotoStore;
import disscount.shared.photo.PhotoStore;
import disscount.shared.photo.PhotoStoreConfig;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;

class PhotoKeysTest {

    @Test
    void everyGeneratedKeyPassesTheDiskStoresValidation(@TempDir Path directory) throws IOException {
        Files.createDirectory(directory.resolve(PhotoStoreConfig.CARD_FOLDER));
        PhotoStore store = new FilesystemPhotoStore(directory, PhotoStoreConfig.CARD_FOLDER,
                AtomicFileStore.Visibility.OWNER_ONLY, "error.cardPhoto.unavailable", null);
        UUID userId = UUID.randomUUID();
        UUID cardId = UUID.randomUUID();
        String sha256 = "a".repeat(64);

        store.put(PhotoKeys.fullKey(userId, cardId, "front", sha256, PhotoKeys.newUploadId(), "webp"), new byte[]{1}, "image/webp");
        store.put(PhotoKeys.thumbKey(userId, cardId, "icon", sha256, PhotoKeys.newUploadId(), "jpg"), new byte[]{1}, "image/jpeg");

        assertThat(directory.resolve(PhotoKeys.cardPrefix(userId, cardId))).isNotEmptyDirectory();
        store.deletePrefix(PhotoKeys.cardPrefix(userId, cardId));
        store.deletePrefix(PhotoKeys.userPrefix(userId));
        assertThat(directory.resolve(PhotoKeys.userPrefix(userId))).doesNotExist();
    }
}
