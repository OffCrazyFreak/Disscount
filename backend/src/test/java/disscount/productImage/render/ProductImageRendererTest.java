package disscount.productImage.render;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Random;

import javax.imageio.ImageIO;

import disscount.digitalCard.photo.TestImages;
import disscount.exceptions.BadRequestException;
import disscount.productImage.render.ProductImageRenderer.Crop;
import disscount.productImage.render.ProductImageRenderer.Rendered;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProductImageRendererTest {

    @Test
    void transparentPhotoKeepsItsShapeOnWhiteAndItsSmallFileIsASquare() throws IOException {
        Rendered rendered = ProductImageRenderer.render(transparentPng(600, 200), 0, null);

        BufferedImage full = decode(rendered.full());
        assertThat(full.getWidth()).isEqualTo(600);
        assertThat(full.getHeight()).isEqualTo(200);
        assertThat(rendered.fullWidth()).isEqualTo(600);
        assertThat(rendered.fullHeight()).isEqualTo(200);
        // The transparent part of the source must become white pixels, not CSS.
        assertWhite(full.getRGB(0, 0));
        assertWhite(full.getRGB(full.getWidth() - 1, full.getHeight() - 1));

        BufferedImage small = decode(rendered.small());
        assertThat(small.getWidth()).isEqualTo(ProductImageRenderer.SMALL_SIDE);
        assertThat(small.getHeight()).isEqualTo(ProductImageRenderer.SMALL_SIDE);
        // Square padding is white too.
        assertWhite(small.getRGB(small.getWidth() / 2, 2));
        assertThat(rendered.sha256()).hasSize(64);
        assertThat(rendered.sourceWidth()).isEqualTo(600);
        assertThat(rendered.sourceHeight()).isEqualTo(200);
    }

    @Test
    void largeSourceIsCappedAtTheFullSideOnItsLongEdge() throws IOException {
        Rendered rendered = ProductImageRenderer.render(TestImages.jpeg(1500, 3000), 0, null);

        BufferedImage full = decode(rendered.full());
        assertThat(full.getHeight()).isEqualTo(ProductImageRenderer.FULL_MAX_SIDE);
        assertThat(full.getWidth()).isEqualTo(ProductImageRenderer.FULL_MAX_SIDE / 2);
        assertThat(rendered.fullHeight()).isEqualTo(full.getHeight());
    }

    @Test
    void smallSourceIsNeverUpscaled() throws IOException {
        Rendered rendered = ProductImageRenderer.render(TestImages.jpeg(100, 50), 0, null);

        assertThat(decode(rendered.full()).getWidth()).isEqualTo(100);
        // 100 px plus 4% margin on each side.
        assertThat(decode(rendered.small()).getWidth()).isEqualTo(108);
    }

    @Test
    void aCropAwayFromTheCornerKeepsItsOwnPixels() throws IOException {
        BufferedImage halves = new BufferedImage(200, 100, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = halves.createGraphics();
        g.setColor(Color.RED);
        g.fillRect(0, 0, 100, 100);
        g.setColor(Color.BLUE);
        g.fillRect(100, 0, 100, 100);
        g.dispose();
        ByteArrayOutputStream png = new ByteArrayOutputStream();
        ImageIO.write(halves, "png", png);

        BufferedImage full = decode(ProductImageRenderer.render(png.toByteArray(), 0, new Crop(110, 20, 60, 40)).full());

        assertThat(full.getWidth()).isEqualTo(60);
        int centre = full.getRGB(30, 20);
        assertThat(centre & 0xff).as("blue").isGreaterThan(200);
        assertThat((centre >> 16) & 0xff).as("red").isLessThan(60);
    }

    @Test
    void cropIsMeasuredAgainstTheRotatedFrame() {
        byte[] wide = TestImages.jpeg(200, 100);

        ProductImageRenderer.render(wide, 90, new Crop(0, 0, 100, 200));

        assertThatThrownBy(() -> ProductImageRenderer.render(wide, 90, new Crop(0, 0, 200, 100)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("error.productImage.crop");
        assertThat(ProductImageRenderer.rotatedSize(200, 100, 270)).containsExactly(100, 200);
    }

    @Test
    void rejectsTinyCropsRotationsOffTheGridAndUnreadableBytes() {
        byte[] jpeg = TestImages.jpeg(200, 100);

        assertThatThrownBy(() -> ProductImageRenderer.render(jpeg, 0, new Crop(0, 0, 8, 8)))
                .hasMessage("error.productImage.crop");
        assertThatThrownBy(() -> ProductImageRenderer.render(jpeg, 45, null))
                .hasMessage("error.productImage.rotation");
        assertThatThrownBy(() -> ProductImageRenderer.render(new byte[] {1, 2, 3, 4}, 0, null))
                .hasMessage("error.productImage.unreadable");
    }

    @Test
    void rendersTwoWebpFilesUnderTheirCeilings() throws IOException {
        Rendered rendered = ProductImageRenderer.render(TestImages.jpeg(2000, 1500), 0, null);

        for (byte[] file : new byte[][] {rendered.full(), rendered.small()}) {
            assertThat(isWebp(file)).isTrue();
        }
        assertThat(decode(rendered.small()).getWidth()).isEqualTo(ProductImageRenderer.SMALL_SIDE);
        assertThat(rendered.full().length).isLessThanOrEqualTo(ProductImageRenderer.FULL_MAX_BYTES);
        assertThat(rendered.small().length).isLessThanOrEqualTo(ProductImageRenderer.SMALL_MAX_BYTES);
    }

    @Test
    void stepsTheQualityDownUntilANoisyPhotoFitsItsCeiling() {
        BufferedImage noise = noise(400);
        int atFirstStep = ProductImageRenderer.encode(noise, Integer.MAX_VALUE).length;

        byte[] capped = ProductImageRenderer.encode(noise, atFirstStep - 1);

        assertThat(capped.length).isLessThan(atFirstStep);
        assertThat(isWebp(capped)).isTrue();
    }

    @Test
    void rejectsSourcesTooLargeToDecodeSafely() {
        assertThatThrownBy(() -> ProductImageRenderer.render(TestImages.png(ProductImageRenderer.MAX_SOURCE_SIDE + 1, 1), 0, null))
                .hasMessage("error.productImage.dimensions");
    }

    private static byte[] transparentPng(int width, int height) throws IOException {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = image.createGraphics();
        g.setColor(new Color(200, 30, 30));
        g.fillRect(width / 4, height / 4, width / 2, height / 2);
        g.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }

    private static boolean isWebp(byte[] file) {
        return file.length > 12
                && new String(Arrays.copyOfRange(file, 0, 4), StandardCharsets.US_ASCII).equals("RIFF")
                && new String(Arrays.copyOfRange(file, 8, 12), StandardCharsets.US_ASCII).equals("WEBP");
    }

    private static BufferedImage noise(int side) {
        BufferedImage image = new BufferedImage(side, side, BufferedImage.TYPE_INT_RGB);
        Random random = new Random(42);
        for (int y = 0; y < side; y++) {
            for (int x = 0; x < side; x++) image.setRGB(x, y, random.nextInt(0x1000000));
        }
        return image;
    }

    private static BufferedImage decode(byte[] bytes) throws IOException {
        return ImageIO.read(new ByteArrayInputStream(bytes));
    }

    private static void assertWhite(int rgb) {
        Color c = new Color(rgb);
        assertThat(c.getRed()).isGreaterThan(245);
        assertThat(c.getGreen()).isGreaterThan(245);
        assertThat(c.getBlue()).isGreaterThan(245);
    }
}
