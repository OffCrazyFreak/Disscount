package disscount.shared.photo;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.MemoryCacheImageInputStream;
import javax.imageio.stream.MemoryCacheImageOutputStream;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;

import disscount.shared.errors.BadRequestException;

/** Re-encoding is what drops EXIF, GPS and embedded thumbnails; the size check runs before any decode. */
final class JpegSanitizer {

    // A phone JPEG is often already below 0.85, so the first step alone would store a bigger file than it received.
    private static final float[] QUALITY_STEPS = {0.85f, 0.80f, 0.75f, 0.70f, 0.60f, 0.50f};

    private JpegSanitizer() {}

    static ValidatedPhoto sanitize(byte[] data, int maxSide) {
        Iterator<ImageReader> readers = ImageIO.getImageReadersByFormatName("jpeg");
        if (!readers.hasNext()) throw invalid();

        ImageReader reader = readers.next();
        try (ImageInputStream input = new MemoryCacheImageInputStream(new ByteArrayInputStream(data))) {
            reader.setInput(input, true, true);

            int width = reader.getWidth(0);
            int height = reader.getHeight(0);
            PhotoValidator.requireDimensions(width, height, maxSide);

            BufferedImage image = reader.read(0);
            return new ValidatedPhoto(smallestUpTo(image, data.length), "image/jpeg", "jpg", width, height);
        } catch (IOException | RuntimeException e) {
            if (e instanceof BadRequestException bad) throw bad;
            throw invalid();
        } finally {
            reader.dispose();
        }
    }

    private static byte[] smallestUpTo(BufferedImage image, int uploadedBytes) throws IOException {
        byte[] smallest = null;
        for (float quality : QUALITY_STEPS) {
            byte[] encoded = encode(image, quality);
            if (encoded.length <= uploadedBytes) return encoded;
            if (smallest == null || encoded.length < smallest.length) smallest = encoded;
        }
        return smallest;
    }

    private static byte[] encode(BufferedImage image, float quality) throws IOException {
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
        try {
            ImageWriteParam param = writer.getDefaultWriteParam();
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(quality);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            try (MemoryCacheImageOutputStream output = new MemoryCacheImageOutputStream(out)) {
                writer.setOutput(output);
                writer.write(null, new IIOImage(image, null, null), param);
            }
            return out.toByteArray();
        } finally {
            writer.dispose();
        }
    }

    private static BadRequestException invalid() {
        return new BadRequestException("error.cardPhoto.invalid");
    }
}
