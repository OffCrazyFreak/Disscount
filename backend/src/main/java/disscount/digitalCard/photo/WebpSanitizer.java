package disscount.digitalCard.photo;

import disscount.exceptions.BadRequestException;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Header level WebP handling with no image library: the RIFF container is walked and rewritten
 * keeping only the chunks that carry pixels, which strips EXIF, XMP and ICC.
 */
final class WebpSanitizer {

    private static final int FLAG_ALPHA = 0x10;

    private WebpSanitizer() {}

    static ValidatedPhoto sanitize(byte[] data, int maxSide) {
        if (data.length < 20 || !fourCc(data, 0).equals("RIFF") || !fourCc(data, 8).equals("WEBP")) {
            throw invalid();
        }
        // Strict equality: a size that disagrees with the file is a truncated or padded upload.
        if (le32(data, 4) + 8L != data.length) {
            throw invalid();
        }

        String first = fourCc(data, 12);
        if (!first.equals("VP8 ") && !first.equals("VP8L") && !first.equals("VP8X")) {
            throw invalid();
        }

        ByteArrayOutputStream body = new ByteArrayOutputStream();
        int[] canvas = null;
        int[] image = null;
        boolean alphaSeen = false;
        int pos = 12;

        while (pos < data.length) {
            if (pos + 8 > data.length) throw invalid();

            String id = fourCc(data, pos);
            long size = le32(data, pos + 4);
            long end = pos + 8L + size;
            if (end > data.length) throw invalid();

            int start = pos + 8;
            switch (id) {
                case "ANIM", "ANMF" -> throw new BadRequestException("Animirane slike nisu podržane");
                case "VP8X" -> {
                    if (size != 10 || canvas != null || pos != 12) throw invalid();
                    canvas = new int[]{le24(data, start + 4) + 1, le24(data, start + 7) + 1};
                    byte[] payload = new byte[10];
                    System.arraycopy(data, start, payload, 0, 10);
                    payload[0] = (byte) (payload[0] & FLAG_ALPHA);
                    payload[1] = 0;
                    payload[2] = 0;
                    payload[3] = 0;
                    writeChunk(body, id, payload);
                }
                case "VP8 " -> {
                    if (image != null || size < 10) throw invalid();
                    if ((data[start + 3] & 0xFF) != 0x9D || (data[start + 4] & 0xFF) != 0x01
                            || (data[start + 5] & 0xFF) != 0x2A) {
                        throw invalid();
                    }
                    image = new int[]{le16(data, start + 6) & 0x3FFF, le16(data, start + 8) & 0x3FFF};
                    copyChunk(body, data, id, start, (int) size);
                }
                case "VP8L" -> {
                    // Lossless carries its own alpha, so a separate ALPH chunk beside it is malformed.
                    if (image != null || alphaSeen || size < 5 || (data[start] & 0xFF) != 0x2F) throw invalid();
                    long bits = le32(data, start + 1);
                    image = new int[]{(int) (bits & 0x3FFF) + 1, (int) ((bits >> 14) & 0x3FFF) + 1};
                    copyChunk(body, data, id, start, (int) size);
                }
                case "ALPH" -> {
                    // Alpha for a lossy frame only: after the VP8X header, once, and before the bitstream it describes.
                    if (canvas == null || alphaSeen || image != null) throw invalid();
                    alphaSeen = true;
                    copyChunk(body, data, id, start, (int) size);
                }
                default -> { /* EXIF, XMP, ICCP and unknown chunks are dropped */ }
            }

            pos = (int) (end + (size & 1));
        }

        if (image == null) throw invalid();
        if (canvas != null && (canvas[0] != image[0] || canvas[1] != image[1])) throw invalid();
        PhotoValidator.requireDimensions(image[0], image[1], maxSide);

        byte[] payload = body.toByteArray();
        ByteArrayOutputStream out = new ByteArrayOutputStream(payload.length + 12);
        out.writeBytes("RIFF".getBytes(StandardCharsets.US_ASCII));
        writeLe32(out, payload.length + 4);
        out.writeBytes("WEBP".getBytes(StandardCharsets.US_ASCII));
        out.writeBytes(payload);

        return new ValidatedPhoto(out.toByteArray(), "image/webp", "webp", image[0], image[1]);
    }

    private static void copyChunk(ByteArrayOutputStream out, byte[] data, String id, int start, int size) {
        byte[] payload = new byte[size];
        System.arraycopy(data, start, payload, 0, size);
        writeChunk(out, id, payload);
    }

    private static void writeChunk(ByteArrayOutputStream out, String id, byte[] payload) {
        out.writeBytes(id.getBytes(StandardCharsets.US_ASCII));
        writeLe32(out, payload.length);
        out.writeBytes(payload);
        if ((payload.length & 1) == 1) out.write(0);
    }

    private static void writeLe32(ByteArrayOutputStream out, int value) {
        out.write(value);
        out.write(value >>> 8);
        out.write(value >>> 16);
        out.write(value >>> 24);
    }

    private static String fourCc(byte[] data, int offset) {
        return new String(data, offset, 4, StandardCharsets.ISO_8859_1);
    }

    private static int le16(byte[] d, int o) {
        return (d[o] & 0xFF) | ((d[o + 1] & 0xFF) << 8);
    }

    private static int le24(byte[] d, int o) {
        return le16(d, o) | ((d[o + 2] & 0xFF) << 16);
    }

    private static long le32(byte[] d, int o) {
        return (le24(d, o) | ((long) (d[o + 3] & 0xFF) << 24)) & 0xFFFFFFFFL;
    }

    private static BadRequestException invalid() {
        return new BadRequestException("Slika nije valjana");
    }
}
