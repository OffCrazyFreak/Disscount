package disscount.digitalCard.storage;

import java.io.Closeable;
import java.io.IOException;
import java.io.InputStream;

/** The caller owns the stream and must close it. */
public record StoredPhoto(InputStream stream, long contentLength, String contentType) implements Closeable {

    @Override
    public void close() throws IOException {
        stream.close();
    }
}
