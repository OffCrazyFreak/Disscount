package disscount.productImage.storage;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Path;

import disscount.exceptions.ServiceUnavailableException;
import disscount.storage.AtomicFileStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Writes the files; the web server in front of the directory sets the content type and cache headers. */
public class FilesystemProductImageStore implements ProductImageStore {

    private static final Logger log = LoggerFactory.getLogger(FilesystemProductImageStore.class);

    private final AtomicFileStore files;
    private final String publicBaseUrl;

    public FilesystemProductImageStore(Path directory, String publicBaseUrl) {
        this.files = new AtomicFileStore(directory, ROOT_FOLDER, AtomicFileStore.Visibility.WORLD_READABLE);
        this.publicBaseUrl = publicBaseUrl.endsWith("/")
                ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
                : publicBaseUrl;
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
            // Usually a full disk: the job or the user retries later, and the log line is what alerts us.
            log.error("Could not store product photo {}", key, e);
            throw new ServiceUnavailableException("error.productImage.unavailable");
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
    public String publicUrl(String key) {
        return publicBaseUrl + "/" + key;
    }
}
