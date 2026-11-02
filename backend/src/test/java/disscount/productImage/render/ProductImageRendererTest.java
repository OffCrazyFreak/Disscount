package disscount.productImage.render;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

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
    void transparentPhotoBecomesASquareOnWhite() throws IOException {
        Rendered rendered = ProductImageRenderer.render(transparentPng(600, 200), 0, null);

        BufferedImage full = decode(rendered.full());
        assertThat(full.getWidth()).isEqualTo(full.getHeight());
        // Corners are padding and the transparent part of the source: both must be white pixels, not CSS.
        assertWhite(full.getRGB(0, 0));
        assertWhite(full.getRGB(full.getWidth() - 1, full.getHeight() - 1));
        assertWhite(full.getRGB(full.getWidth() / 2, 5));

        BufferedImage thumb = decode(rendered.thumb());
        assertThat(thumb.getWidth()).isEqualTo(ProductImageRenderer.THUMB_SIDE);
        assertThat(thumb.getHeight()).isEqualTo(ProductImageRenderer.THUMB_SIDE);
        assertThat(rendered.sha256()).hasSize(64);
        assertThat(rendered.sourceWidth()).isEqualTo(600);
        assertThat(rendered.sourceHeight()).isEqualTo(200);
    }

    @Test
    void largeSourceIsCappedAtTheFullSide() throws IOException {
        BufferedImage full = decode(ProductImageRenderer.render(TestImages.jpeg(2000, 1500), 0, null).full());
        assertThat(full.getWidth()).isEqualTo(ProductImageRenderer.FULL_SIDE);
    }

    @Test
    void smallSourceIsNeverUpscaled() throws IOException {
        Rendered rendered = ProductImageRenderer.render(TestImages.jpeg(100, 50), 0, null);

        // 100 px plus 4% margin on each side.
        assertThat(decode(rendered.full()).getWidth()).isEqualTo(108);
        assertThat(decode(rendered.thumb()).getWidth()).isEqualTo(108);
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
