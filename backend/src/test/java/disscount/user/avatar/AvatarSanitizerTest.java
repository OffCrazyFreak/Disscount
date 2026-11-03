package disscount.user.avatar;

import disscount.digitalCard.photo.PhotoValidator;
import disscount.exceptions.BadRequestException;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static disscount.digitalCard.photo.TestImages.contains;
import static disscount.digitalCard.photo.TestImages.jpeg;
import static disscount.digitalCard.photo.TestImages.jpegWithApp1;
import static disscount.digitalCard.photo.TestImages.png;
import static disscount.digitalCard.photo.TestImages.webp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AvatarSanitizerTest {

    private final AvatarSanitizer sanitizer = new AvatarSanitizer(new PhotoValidator());

    private static String dataUri(String type, byte[] bytes) {
        return "data:" + type + ";base64," + Base64.getEncoder().encodeToString(bytes);
    }

    private static byte[] payload(String dataUri) {
        return Base64.getDecoder().decode(dataUri.substring(dataUri.indexOf(',') + 1));
    }

    @Test
    void keepsWebp() {
        String stored = sanitizer.sanitize(dataUri("image/webp", webp(256, 256)));

        assertThat(stored).startsWith("data:image/webp;base64,");
    }

    @Test
    void stripsGpsFromJpeg() {
        byte[] withExif = jpegWithApp1(jpeg(256, 256), "secret-gps");

        String stored = sanitizer.sanitize(dataUri("image/jpeg", withExif));

        assertThat(stored).startsWith("data:image/jpeg;base64,");
        assertThat(contains(payload(stored), "secret-gps")).isFalse();
    }

    @Test
    void labelsByContentNotByTheClaimedType() {
        String stored = sanitizer.sanitize(dataUri("image/webp", jpeg(64, 64)));

        assertThat(stored).startsWith("data:image/jpeg;base64,");
    }

    @Test
    void rejectsPng() {
        assertThatThrownBy(() -> sanitizer.sanitize(dataUri("image/png", png(64, 64))))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void rejectsAnythingThatIsNotABase64DataUri() {
        assertThatThrownBy(() -> sanitizer.sanitize("https://example.com/me.jpg"))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> sanitizer.sanitize("data:image/jpeg;base64,***"))
                .isInstanceOf(BadRequestException.class);
    }
}
