package disscount.digitalCard.photo;

import disscount.exceptions.BadRequestException;
import org.springframework.stereotype.Component;

/**
 * Accepts only WebP and JPEG, decided by magic bytes and never by the client's Content-Type or
 * file name, and returns freshly written bytes with all metadata removed.
 */
@Component
public class PhotoValidator {

    public static final int MAX_BYTES = 512 * 1024;
    public static final int MAX_SIDE = 2048;

    public ValidatedPhoto validate(byte[] data) {
        if (data == null || data.length == 0) {
            throw new BadRequestException("error.cardPhoto.empty");
        }
        if (data.length > MAX_BYTES) {
            throw new BadRequestException("error.cardPhoto.tooLarge", String.valueOf(MAX_BYTES / 1024));
        }

        if (isJpeg(data)) {
            return JpegSanitizer.sanitize(data, MAX_SIDE);
        }
        if (isRiff(data)) {
            return WebpSanitizer.sanitize(data, MAX_SIDE);
        }
        throw new BadRequestException("error.cardPhoto.unsupportedFormat");
    }

    static void requireDimensions(int width, int height, int maxSide) {
        if (width < 1 || height < 1 || width > maxSide || height > maxSide) {
            throw new BadRequestException("error.cardPhoto.dimensions", String.valueOf(maxSide));
        }
    }

    private static boolean isJpeg(byte[] d) {
        return d.length > 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8 && (d[2] & 0xFF) == 0xFF;
    }

    private static boolean isRiff(byte[] d) {
        return d.length > 3 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F';
    }
}
