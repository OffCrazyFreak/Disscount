package disscount.digitalCard.photo;

import disscount.exceptions.BadRequestException;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import static disscount.digitalCard.photo.TestImages.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PhotoValidatorTest {

    private final PhotoValidator validator = new PhotoValidator();

    @Test
    void acceptsSimpleWebp() {
        ValidatedPhoto photo = validator.validate(webp(640, 480));

        assertThat(photo.contentType()).isEqualTo("image/webp");
        assertThat(photo.extension()).isEqualTo("webp");
        assertThat(photo.width()).isEqualTo(640);
        assertThat(photo.height()).isEqualTo(480);
    }

    @Test
    void acceptsJpegAndReencodesIt() throws IOException {
        ValidatedPhoto photo = validator.validate(jpeg(300, 200));

        assertThat(photo.contentType()).isEqualTo("image/jpeg");
        assertThat(photo.extension()).isEqualTo("jpg");
        BufferedImage decoded = ImageIO.read(new ByteArrayInputStream(photo.bytes()));
        assertThat(decoded.getWidth()).isEqualTo(300);
        assertThat(decoded.getHeight()).isEqualTo(200);
    }

    @Test
    void stripsWebpMetadataChunks() {
        byte[] withMetadata = riff(
                vp8x(64, 64, 0x2C),
                chunk("ICCP", "secret-icc".getBytes(StandardCharsets.US_ASCII)),
                vp8(64, 64),
                chunk("EXIF", "secret-gps".getBytes(StandardCharsets.US_ASCII)),
                chunk("XMP ", "secret-xmp".getBytes(StandardCharsets.US_ASCII)));

        ValidatedPhoto photo = validator.validate(withMetadata);

        assertThat(contains(photo.bytes(), "secret-")).isFalse();
        assertThat(contains(photo.bytes(), "EXIF")).isFalse();
        assertThat(contains(photo.bytes(), "ICCP")).isFalse();
        assertThat(contains(photo.bytes(), "VP8X")).isTrue();
        assertThat(contains(photo.bytes(), "VP8 ")).isTrue();
        // ICC, EXIF and XMP flags are cleared; the output must still be a self-consistent RIFF.
        assertThat(photo.bytes()[20] & 0x2C).isZero();
        assertThat(validator.validate(photo.bytes()).width()).isEqualTo(64);
    }

    @Test
    void stripsJpegMetadata() {
        byte[] withExif = jpegWithApp1(jpeg(32, 32), "secret-gps");
        assertThat(contains(withExif, "secret-gps")).isTrue();

        ValidatedPhoto photo = validator.validate(withExif);

        assertThat(contains(photo.bytes(), "secret-gps")).isFalse();
        assertThat(contains(photo.bytes(), "Exif")).isFalse();
    }

    @Test
    void rejectsPng() {
        assertRejected(png(10, 10));
    }

    @Test
    void rejectsSvg() {
        assertRejected("<svg xmlns=\"http://www.w3.org/2000/svg\"/>".getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void rejectsTruncatedJpeg() {
        byte[] jpeg = jpeg(200, 200);
        assertRejected(Arrays.copyOf(jpeg, jpeg.length / 3));
    }

    @Test
    void rejectsTruncatedWebp() {
        byte[] webp = webp(100, 100);
        assertRejected(Arrays.copyOf(webp, webp.length - 4));
    }

    @Test
    void rejectsEmpty() {
        assertRejected(new byte[0]);
    }

    @Test
    void rejectsOversizedFile() {
        byte[] big = new byte[PhotoValidator.MAX_BYTES + 1];
        System.arraycopy(webp(10, 10), 0, big, 0, 20);
        assertRejected(big);
    }

    @Test
    void rejectsOversizedDimensionsInWebp() {
        assertRejected(webp(2049, 100));
        assertRejected(webp(100, 2049));
    }

    @Test
    void rejectsOversizedDimensionsInJpegBeforeDecoding() {
        assertRejected(jpeg(2100, 8));
    }

    @Test
    void acceptsMaximumDimensions() {
        assertThat(validator.validate(webp(2048, 2048)).width()).isEqualTo(2048);
    }

    @Test
    void rejectsAnimatedWebp() {
        assertRejected(riff(vp8x(64, 64, 0x02), chunk("ANIM", new byte[6]), chunk("ANMF", new byte[16])));
    }

    @Test
    void rejectsWrongRiffSize() {
        assertRejected(riff(8, vp8(64, 64)));
        assertRejected(riff(-2, vp8(64, 64)));
    }

    @Test
    void rejectsUnknownFirstChunk() {
        assertRejected(riff(chunk("JUNK", new byte[4]), vp8(64, 64)));
    }

    @Test
    void rejectsCanvasThatDisagreesWithTheBitstream() {
        assertRejected(riff(vp8x(4000, 4000, 0), vp8(64, 64)));
    }

    @Test
    void rejectsRiffThatIsNotWebp() {
        byte[] wave = webp(64, 64);
        wave[8] = 'W';
        wave[9] = 'A';
        wave[10] = 'V';
        wave[11] = 'E';
        assertRejected(wave);
    }

    @Test
    void keepsAlphaOnlyWhenItSitsBetweenVp8xAndTheLossyFrame() {
        byte[] alpha = chunk("ALPH", new byte[]{1, 2, 3, 4});

        ValidatedPhoto photo = validator.validate(riff(vp8x(64, 64, 0x10), alpha, vp8(64, 64)));

        assertThat(contains(photo.bytes(), "ALPH")).isTrue();
        assertThat(validator.validate(photo.bytes()).width()).isEqualTo(64);
    }

    @Test
    void rejectsAlphaWithoutVp8xAfterTheFrameOrRepeated() {
        byte[] alpha = chunk("ALPH", new byte[]{1, 2, 3, 4});

        assertRejected(riff(vp8(64, 64), alpha));
        assertRejected(riff(vp8x(64, 64, 0x10), vp8(64, 64), alpha));
        assertRejected(riff(vp8x(64, 64, 0x10), alpha, alpha, vp8(64, 64)));
        assertRejected(riff(vp8x(64, 64, 0x10), alpha, vp8l(64, 64)));
    }

    private static byte[] vp8l(int width, int height) {
        long bits = (width - 1) | ((long) (height - 1) << 14);
        return chunk("VP8L", new byte[]{0x2F, (byte) bits, (byte) (bits >> 8), (byte) (bits >> 16), (byte) (bits >> 24)});
    }

    private void assertRejected(byte[] data) {
        assertThatThrownBy(() -> validator.validate(data)).isInstanceOf(BadRequestException.class);
    }
}
