package disscount.digitalCard.photo;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/** Builds image bytes in code so no binary fixtures live in the repo. */
public final class TestImages {

    private TestImages() {}

    public static byte[] jpeg(int width, int height) {
        try {
            BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(image, "jpg", out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    public static byte[] png(int width, int height) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), "png", out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    /** Inserts an APP1 (EXIF style) segment straight after the SOI marker. */
    public static byte[] jpegWithApp1(byte[] jpeg, String marker) {
        byte[] payload = ("Exif\0\0" + marker).getBytes(StandardCharsets.ISO_8859_1);
        int length = payload.length + 2;
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(jpeg, 0, 2);
        out.write(0xFF);
        out.write(0xE1);
        out.write(length >> 8);
        out.write(length & 0xFF);
        out.writeBytes(payload);
        out.write(jpeg, 2, jpeg.length - 2);
        return out.toByteArray();
    }

    /** A lossy "VP8 " chunk with a valid frame header and no real bitstream: the validator reads headers only. */
    public static byte[] vp8(int width, int height) {
        byte[] p = new byte[10];
        p[3] = (byte) 0x9D;
        p[4] = 0x01;
        p[5] = 0x2A;
        p[6] = (byte) width;
        p[7] = (byte) (width >> 8);
        p[8] = (byte) height;
        p[9] = (byte) (height >> 8);
        return chunk("VP8 ", p);
    }

    public static byte[] vp8x(int width, int height, int flags) {
        byte[] p = new byte[10];
        p[0] = (byte) flags;
        p[4] = (byte) (width - 1);
        p[5] = (byte) ((width - 1) >> 8);
        p[6] = (byte) ((width - 1) >> 16);
        p[7] = (byte) (height - 1);
        p[8] = (byte) ((height - 1) >> 8);
        p[9] = (byte) ((height - 1) >> 16);
        return chunk("VP8X", p);
    }

    public static byte[] chunk(String id, byte[] payload) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.writeBytes(id.getBytes(StandardCharsets.US_ASCII));
        out.write(payload.length);
        out.write(payload.length >> 8);
        out.write(payload.length >> 16);
        out.write(payload.length >> 24);
        out.writeBytes(payload);
        if (payload.length % 2 == 1) out.write(0);
        return out.toByteArray();
    }

    public static byte[] riff(byte[]... chunks) {
        return riff(0, chunks);
    }

    /** {@code sizeError} is added to the correct RIFF size to build a lying header. */
    public static byte[] riff(int sizeError, byte[]... chunks) {
        ByteArrayOutputStream body = new ByteArrayOutputStream();
        for (byte[] c : chunks) body.writeBytes(c);
        int size = body.size() + 4 + sizeError;

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.writeBytes("RIFF".getBytes(StandardCharsets.US_ASCII));
        out.write(size);
        out.write(size >> 8);
        out.write(size >> 16);
        out.write(size >> 24);
        out.writeBytes("WEBP".getBytes(StandardCharsets.US_ASCII));
        out.writeBytes(body.toByteArray());
        return out.toByteArray();
    }

    public static byte[] webp(int width, int height) {
        return riff(vp8(width, height));
    }

    public static boolean contains(byte[] haystack, String needle) {
        return new String(haystack, StandardCharsets.ISO_8859_1).contains(needle);
    }
}
