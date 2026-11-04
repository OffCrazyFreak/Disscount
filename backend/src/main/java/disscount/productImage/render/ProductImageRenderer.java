package disscount.productImage.render;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Iterator;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.MemoryCacheImageOutputStream;

import com.luciad.imageio.webp.CompressionType;
import com.luciad.imageio.webp.WebPWriteParam;

import disscount.exceptions.BadRequestException;

/** White is painted into the pixels because dark mode extensions recolour CSS backgrounds but leave image pixels alone. */
public final class ProductImageRenderer {

    public static final int FULL_SIDE = 1080;
    public static final int THUMB_SIDE = 400;
    /** Used wherever a photo is drawn small (list rows, the product page tile up to about 128 CSS pixels), sharp on 2x screens. */
    public static final int SMALL_SIDE = 256;
    public static final int MIN_CROP_SIDE = 16;

    // Decoded as 4 bytes a pixel, so this caps one render at roughly 100 MB of heap.
    static final long MAX_SOURCE_PIXELS = 24_000_000L;
    static final int MAX_SOURCE_SIDE = 10_000;

    private static final double MARGIN = 0.04;
    // WebP quality 80 measured about half the bytes of the earlier JPEG at 86 on our photos.
    private static final float[] QUALITY_STEPS = {0.80f, 0.70f, 0.60f, 0.50f};
    // Noisy photos can blow past the usual size; each step down trades a little detail to stay under these.
    public static final int FULL_MAX_BYTES = 200_000;
    public static final int THUMB_MAX_BYTES = 60_000;
    public static final int SMALL_MAX_BYTES = 30_000;

    public record Crop(int x, int y, int width, int height) {}

    public record Rendered(byte[] full, byte[] thumb, byte[] small, String sha256, int sourceWidth, int sourceHeight) {

        public boolean overCeiling() {
            return full.length > FULL_MAX_BYTES || thumb.length > THUMB_MAX_BYTES || small.length > SMALL_MAX_BYTES;
        }
    }

    private ProductImageRenderer() {}

    /** The crop is in pixels of the source after rotation, the way Open Food Facts stores it. */
    public static Rendered render(byte[] source, int rotation, Crop crop) {
        BufferedImage decoded = decode(source);
        int sourceWidth = decoded.getWidth();
        int sourceHeight = decoded.getHeight();

        BufferedImage rotated = rotate(onWhite(decoded), normalizeRotation(rotation));
        BufferedImage content = crop == null ? rotated : cropped(rotated, crop);

        BufferedImage full = squareOnWhite(content, FULL_SIDE);
        BufferedImage thumb = scaled(full, Math.min(THUMB_SIDE, full.getWidth()));
        BufferedImage small = scaled(thumb, Math.min(SMALL_SIDE, thumb.getWidth()));

        byte[] fullBytes = encode(full, FULL_MAX_BYTES);
        return new Rendered(fullBytes, encode(thumb, THUMB_MAX_BYTES), encode(small, SMALL_MAX_BYTES),
                sha256(fullBytes), sourceWidth, sourceHeight);
    }

    public static int normalizeRotation(int rotation) {
        int normalized = ((rotation % 360) + 360) % 360;
        if (normalized % 90 != 0) {
            throw new BadRequestException("error.productImage.rotation");
        }
        return normalized;
    }

    public static int[] rotatedSize(int width, int height, int rotation) {
        int normalized = normalizeRotation(rotation);
        return normalized == 90 || normalized == 270 ? new int[] {height, width} : new int[] {width, height};
    }

    private static BufferedImage decode(byte[] source) {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(source))) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (input == null || !readers.hasNext()) throw unreadable();

            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width < 1 || height < 1 || width > MAX_SOURCE_SIDE || height > MAX_SOURCE_SIDE
                        || (long) width * height > MAX_SOURCE_PIXELS) {
                    throw new BadRequestException("error.productImage.dimensions");
                }
                return reader.read(0);
            } finally {
                reader.dispose();
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (IOException | RuntimeException e) {
            // ImageIO rejects CMYK JPEGs and truncated files with runtime exceptions as well as IOExceptions.
            throw unreadable();
        }
    }

    private static BufferedImage onWhite(BufferedImage image) {
        BufferedImage rgb = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        try {
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, rgb.getWidth(), rgb.getHeight());
            g.drawImage(image, 0, 0, null);
        } finally {
            g.dispose();
        }
        return rgb;
    }

    private static BufferedImage rotate(BufferedImage image, int rotation) {
        if (rotation == 0) return image;

        int[] size = rotatedSize(image.getWidth(), image.getHeight(), rotation);
        BufferedImage out = new BufferedImage(size[0], size[1], BufferedImage.TYPE_INT_RGB);
        AffineTransform transform = new AffineTransform();
        transform.translate(size[0] / 2.0, size[1] / 2.0);
        transform.rotate(Math.toRadians(rotation));
        transform.translate(-image.getWidth() / 2.0, -image.getHeight() / 2.0);

        Graphics2D g = out.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
            g.drawImage(image, transform, null);
        } finally {
            g.dispose();
        }
        return out;
    }

    private static BufferedImage cropped(BufferedImage image, Crop crop) {
        boolean inside = crop.x() >= 0 && crop.y() >= 0
                && crop.width() >= MIN_CROP_SIDE && crop.height() >= MIN_CROP_SIDE
                && (long) crop.x() + crop.width() <= image.getWidth()
                && (long) crop.y() + crop.height() <= image.getHeight();
        if (!inside) {
            throw new BadRequestException("error.productImage.crop");
        }
        return image.getSubimage(crop.x(), crop.y(), crop.width(), crop.height());
    }

    private static BufferedImage squareOnWhite(BufferedImage content, int maxSide) {
        int longEdge = Math.max(content.getWidth(), content.getHeight());
        int padded = (int) Math.ceil(longEdge * (1 + 2 * MARGIN));
        // Never upscale: a small source gains nothing but blur from more pixels.
        int side = Math.min(maxSide, padded);
        double scale = (double) side / padded;

        int width = Math.max(1, (int) Math.round(content.getWidth() * scale));
        int height = Math.max(1, (int) Math.round(content.getHeight() * scale));
        BufferedImage resized = resize(content, width, height);

        BufferedImage canvas = new BufferedImage(side, side, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = canvas.createGraphics();
        try {
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, side, side);
            g.drawImage(resized, (side - width) / 2, (side - height) / 2, null);
        } finally {
            g.dispose();
        }
        return canvas;
    }

    private static BufferedImage scaled(BufferedImage square, int side) {
        return resize(square, side, side);
    }

    /** Halves first: a single bicubic step from a much larger image skips pixels and looks jagged. */
    private static BufferedImage resize(BufferedImage image, int width, int height) {
        BufferedImage current = image;
        while (current.getWidth() / 2 >= width && current.getHeight() / 2 >= height) {
            current = draw(current, current.getWidth() / 2, current.getHeight() / 2, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        }
        if (current.getWidth() == width && current.getHeight() == height) return current;
        return draw(current, width, height, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
    }

    private static BufferedImage draw(BufferedImage image, int width, int height, Object interpolation) {
        BufferedImage out = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = out.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, interpolation);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.drawImage(image, 0, 0, width, height, null);
        } finally {
            g.dispose();
        }
        return out;
    }

    static byte[] encode(BufferedImage image, int maxBytes) {
        byte[] encoded = null;
        for (float quality : QUALITY_STEPS) {
            encoded = webp(image, quality);
            if (encoded.length <= maxBytes) return encoded;
        }
        return encoded;
    }

    private static byte[] webp(BufferedImage image, float quality) {
        ImageWriter writer = ImageIO.getImageWritersByMIMEType("image/webp").next();
        try {
            WebPWriteParam param = (WebPWriteParam) writer.getDefaultWriteParam();
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionType(CompressionType.Lossy);
            param.setCompressionQuality(quality);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            try (MemoryCacheImageOutputStream output = new MemoryCacheImageOutputStream(out)) {
                writer.setOutput(output);
                writer.write(null, new IIOImage(image, null, null), param);
            }
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("WebP encoding failed", e);
        } finally {
            writer.dispose();
        }
    }

    public static String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static BadRequestException unreadable() {
        return new BadRequestException("error.productImage.unreadable");
    }
}
