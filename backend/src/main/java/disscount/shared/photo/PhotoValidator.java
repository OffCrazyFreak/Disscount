package disscount.shared.photo;

import org.springframework.stereotype.Component;

import disscount.shared.errors.BadRequestException;

/** Decided by magic bytes, never by the client's Content-Type or file name. */
@Component
public class PhotoValidator {

    public static final int MAX_BYTES = 512 * 1024;
    public static final int MAX_SIDE = 2048;

    public ValidatedPhoto validate(byte[] data) {
        return validate(data, MAX_BYTES, MAX_SIDE);
    }

    /** For a kind of photo that is stored smaller than a card photo, such as an avatar. */
    public ValidatedPhoto validate(byte[] data, int maxBytes, int maxSide) {
        if (data == null || data.length == 0) {
            throw new BadRequestException("error.cardPhoto.empty");
        }
        if (data.length > maxBytes) {
            throw new BadRequestException("error.cardPhoto.tooLarge", String.valueOf(maxBytes / 1024));
        }

        ValidatedPhoto photo;
        if (isJpeg(data)) {
            photo = JpegSanitizer.sanitize(data, maxSide);
        } else if (isRiff(data)) {
            photo = WebpSanitizer.sanitize(data, maxSide);
        } else {
            throw new BadRequestException("error.cardPhoto.unsupportedFormat");
        }
        // The limit is on what we store, so a re-encode that grew the file is held to it too.
        if (photo.bytes().length > maxBytes) {
            throw new BadRequestException("error.cardPhoto.tooLarge", String.valueOf(maxBytes / 1024));
        }
        return photo;
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
