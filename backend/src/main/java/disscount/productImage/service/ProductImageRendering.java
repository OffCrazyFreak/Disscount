package disscount.productImage.service;

import java.io.IOException;
import java.io.InputStream;

import disscount.digitalCard.storage.PhotoStore;
import disscount.digitalCard.storage.StoredPhoto;
import disscount.exceptions.NotFoundException;
import disscount.productImage.dao.ProductImageRepository;
import disscount.productImage.domain.ImageSource;
import disscount.productImage.domain.ImageStatus;
import disscount.productImage.domain.ProductImage;
import disscount.productImage.off.OffImageUrls;
import disscount.productImage.off.OpenFoodFactsClient;
import disscount.productImage.render.ProductImageRenderer;
import disscount.productImage.render.ProductImageRenderer.Crop;
import disscount.productImage.render.ProductImageRenderer.Rendered;
import disscount.productImage.storage.ProductImageStore;
import disscount.util.Timestamps;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** Renders a photo from its untouched source, so a new crop never compounds an earlier one. */
@Component
@RequiredArgsConstructor
public class ProductImageRendering {

    private static final Logger log = LoggerFactory.getLogger(ProductImageRendering.class);

    private final ProductImageStore store;
    private final PhotoStore originals;
    private final OpenFoodFactsClient off;
    private final ProductImageRepository images;

    public void render(ProductImage image) {
        Crop crop = image.hasCrop()
                ? new Crop(image.getCropX(), image.getCropY(), image.getCropWidth(), image.getCropHeight())
                : null;
        Rendered rendered = ProductImageRenderer.render(source(image), image.getRotation(), crop);

        String base = "products/" + image.getEan() + "/" + rendered.sha256().substring(0, 20);
        String fullKey = base + ".jpg";
        String thumbKey = base + "-thumb.jpg";
        store.put(fullKey, rendered.full(), "image/jpeg");
        store.put(thumbKey, rendered.thumb(), "image/jpeg");

        String oldFull = image.getFullKey();
        String oldThumb = image.getThumbKey();
        image.setFullKey(fullKey);
        image.setThumbKey(thumbKey);
        image.setRenderedAt(Timestamps.nowUtc());
        image.setOriginalWidth(rendered.sourceWidth());
        image.setOriginalHeight(rendered.sourceHeight());
        if (image.getStatus() == ImageStatus.CANDIDATE) {
            image.setStatus(ImageStatus.VERIFIED);
        }
        images.save(image);

        deleteIfUnused(oldFull, fullKey);
        deleteIfUnused(oldThumb, thumbKey);
    }

    public String originalUrl(ProductImage image) {
        if (image.getSource() == ImageSource.OPEN_FOOD_FACTS) {
            return OffImageUrls.full(image.getEan(), image.getExternalKey(), image.getExternalRev());
        }
        return null;
    }

    private byte[] source(ProductImage image) {
        if (image.getSource() == ImageSource.OPEN_FOOD_FACTS) {
            return off.download(originalUrl(image));
        }
        StoredPhoto stored = originals.get(image.getOriginalKey())
                .orElseThrow(() -> new NotFoundException("error.productImage.notFound"));
        try (stored; InputStream in = stored.stream()) {
            return in.readAllBytes();
        } catch (IOException e) {
            throw new IllegalStateException("Could not read the original photo", e);
        }
    }

    private void deleteIfUnused(String oldKey, String newKey) {
        if (oldKey == null || oldKey.equals(newKey)) return;
        if (images.existsByFullKey(oldKey) || images.existsByThumbKey(oldKey)) return;
        try {
            store.delete(oldKey);
        } catch (RuntimeException e) {
            // An orphaned file costs a few kilobytes; failing the admin's crop over it would cost more.
            log.warn("Could not delete replaced product photo {}", oldKey, e);
        }
    }
}
