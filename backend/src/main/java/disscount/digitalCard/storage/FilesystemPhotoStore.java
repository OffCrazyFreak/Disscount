package disscount.digitalCard.storage;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Path;
import java.util.Optional;

import disscount.exceptions.ServiceUnavailableException;
import disscount.storage.AtomicFileStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FilesystemPhotoStore implements PhotoStore {

    private static final Logger log = LoggerFactory.getLogger(FilesystemPhotoStore.class);

    private final AtomicFileStore files;
    private final String unavailableMessageKey;

    public FilesystemPhotoStore(Path directory, String folderName, String unavailableMessageKey) {
        this.files = new AtomicFileStore(directory, folderName, AtomicFileStore.Visibility.OWNER_ONLY);
        this.unavailableMessageKey = unavailableMessageKey;
    }

    @Override
    public boolean enabled() {
        return files.isAvailable();
    }

    @Override
    public void put(String key, byte[] bytes, String contentType) {
        try {
            files.write(key, bytes);
        } catch (IOException e) {
            // Usually a full disk: the user can retry later, and the log line is what alerts us.
            log.error("Could not store photo {}", key, e);
            throw new ServiceUnavailableException(unavailableMessageKey);
        }
    }

    @Override
    public Optional<StoredPhoto> get(String key) {
        try {
            return files.open(key).map(file -> new StoredPhoto(file.stream(), file.size(), contentType(key)));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    @Override
    public void delete(String key) {
        try {
            files.delete(key);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    @Override
    public void deletePrefix(String prefix) {
        try {
            files.deletePrefix(prefix);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    // A file has no metadata to hold the type, and validation only ever produces these two extensions.
    private static String contentType(String key) {
        return key.endsWith(".webp") ? "image/webp" : "image/jpeg";
    }
}
