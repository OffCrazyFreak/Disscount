package disscount.user;

import disscount.shared.errors.BadRequestException;
import disscount.shared.photo.PhotoValidator;
import disscount.shared.photo.ValidatedPhoto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Base64;

/** Rewritten here so a client skipping its shrink step cannot store PNG, SVG or EXIF and GPS metadata. */
@Component
@RequiredArgsConstructor
class AvatarSanitizer {

    private static final String PREFIX = "data:";
    private static final String BASE64_MARKER = ";base64,";

    private final PhotoValidator validator;

    public String sanitize(String dataUri) {
        ValidatedPhoto photo = validator.validate(decode(dataUri));
        return PREFIX + photo.contentType() + BASE64_MARKER + Base64.getEncoder().encodeToString(photo.bytes());
    }

    private static byte[] decode(String dataUri) {
        int marker = dataUri.indexOf(BASE64_MARKER);
        if (!dataUri.startsWith(PREFIX) || marker < 0) {
            throw new BadRequestException("error.cardPhoto.invalid");
        }
        try {
            return Base64.getDecoder().decode(dataUri.substring(marker + BASE64_MARKER.length()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("error.cardPhoto.invalid");
        }
    }
}
