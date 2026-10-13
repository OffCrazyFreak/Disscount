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
            throw new BadRequestException("Slika je prazna");
        }
        if (data.length > MAX_BYTES) {
            throw new BadRequestException("Slika je prevelika (najviše 512 KB)");
        }

        if (isJpeg(data)) {
            return JpegSanitizer.sanitize(data, MAX_SIDE);
        }
        if (isRiff(data)) {
            return WebpSanitizer.sanitize(data, MAX_SIDE);
        }
        throw new BadRequestException("Podržani su samo WebP i JPEG");
    }

    static void requireDimensions(int width, int height, int maxSide) {
        if (width < 1 || height < 1 || width > maxSide || height > maxSide) {
            throw new BadRequestException("Slika može imati najviše " + maxSide + " px po stranici");
        }
    }

    private static boolean isJpeg(byte[] d) {
        return d.length > 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8 && (d[2] & 0xFF) == 0xFF;
    }

    private static boolean isRiff(byte[] d) {
        return d.length > 3 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F';
    }
}
