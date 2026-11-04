package disscount.productImage.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;

import disscount.digitalCard.storage.StoredPhoto;
import disscount.exceptions.NotFoundException;
import disscount.exceptions.ServiceUnavailableException;
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
import disscount.productImage.storage.ProductOriginalStore;
import disscount.util.Timestamps;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** Renders a photo from its untouched source, so a new crop never compounds an earlier one. */
@Component
@RequiredArgsConstructor
public class ProductImageRendering {

    private static final Logger log = LoggerFactory.getLogger(ProductImageRendering.class);
    private static final String WEBP = "image/webp";

    private final ProductImageStore store;
    private final ProductOriginalStore originals;
    private final OpenFoodFactsClient off;
    private final ProductImageRepository images;

    public void render(ProductImage image) {
        apply(image, upload(image));
    }

    /**
     * The background copy downloads for seconds, so it writes onto the row as it is now and drops its copy
     * when an admin or the weekly import changed the photo meanwhile.
     */
    public void renderCandidate(ProductImage loaded) {
        Copy copy = upload(loaded);
        ProductImage current = images.findById(loaded.getId())
                .filter(i -> stillWaiting(i, loaded) && sameFraming(i, loaded))
                .orElse(null);
        if (current == null) {
            deleteIfUnused(copy.fullKey(), null);
            deleteIfUnused(copy.thumbKey(), null);
            deleteIfUnused(copy.smallKey(), null);
            return;
        }
        current.setRenderAttempts(null);
        current.setRenderRetryAt(null);
        apply(current, copy);
    }

    /** Renders a shown photo again from its source, dropping the result when an admin reframed or replaced it meanwhile. */
    public void rerender(ProductImage loaded) {
        Copy copy = upload(loaded);
        ProductImage current = images.findById(loaded.getId())
                .filter(i -> Objects.equals(i.getFullKey(), loaded.getFullKey()) && sameFraming(i, loaded))
                .orElse(null);
        if (current == null) {
            deleteIfUnused(copy.fullKey(), null);
            deleteIfUnused(copy.thumbKey(), null);
            deleteIfUnused(copy.smallKey(), null);
            return;
        }
        current.setRenderAttempts(null);
        current.setRenderRetryAt(null);
        apply(current, copy);
    }

    /** True while the row is still the uncopied candidate the job loaded, so the job may write to it. */
    static boolean stillWaiting(ProductImage current, ProductImage loaded) {
        return current.getStatus() == ImageStatus.CANDIDATE && !current.isRendered()
                && Objects.equals(current.getExternalRev(), loaded.getExternalRev());
    }

    private static boolean sameFraming(ProductImage current, ProductImage loaded) {
        return current.getRotation() == loaded.getRotation()
                && Objects.equals(current.getCropX(), loaded.getCropX())
                && Objects.equals(current.getCropY(), loaded.getCropY())
                && Objects.equals(current.getCropWidth(), loaded.getCropWidth())
                && Objects.equals(current.getCropHeight(), loaded.getCropHeight());
    }

    private Copy upload(ProductImage image) {
        Crop crop = image.hasCrop()
                ? new Crop(image.getCropX(), image.getCropY(), image.getCropWidth(), image.getCropHeight())
                : null;
        Rendered rendered = ProductImageRenderer.render(source(image), image.getRotation(), crop);
        if (rendered.overCeiling()) {
            log.info("Product photo {} for {} stays over its size ceiling at the lowest quality: full {}, thumb {}, small {} bytes",
                    image.getId(), image.getEan(), rendered.full().length, rendered.thumb().length, rendered.small().length);
        }

        String base = ProductImageStore.ROOT_FOLDER + "/" + image.getEan() + "/" + rendered.sha256().substring(0, 20);
        Copy copy = new Copy(base + ".webp", base + "-thumb.webp", base + "-small.webp",
                rendered.sourceWidth(), rendered.sourceHeight());
        store.put(copy.fullKey(), rendered.full(), WEBP);
        store.put(copy.thumbKey(), rendered.thumb(), WEBP);
        store.put(copy.smallKey(), rendered.small(), WEBP);
        return copy;
    }

    private void apply(ProductImage image, Copy copy) {
        String oldFull = image.getFullKey();
        String oldThumb = image.getThumbKey();
        String oldSmall = image.getSmallKey();
        image.setFullKey(copy.fullKey());
        image.setThumbKey(copy.thumbKey());
        image.setSmallKey(copy.smallKey());
        image.setRenderedAt(Timestamps.nowUtc());
        image.setOriginalWidth(copy.width());
        image.setOriginalHeight(copy.height());
        if (image.getStatus() == ImageStatus.CANDIDATE) {
            image.setStatus(ImageStatus.VERIFIED);
        }
        images.save(image);

        deleteIfUnused(oldFull, copy.fullKey());
        deleteIfUnused(oldThumb, copy.thumbKey());
        deleteIfUnused(oldSmall, copy.smallKey());
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
        // The row exists but its folder is switched off, which is an outage rather than a missing photo.
        if (!originals.enabled()) throw new ServiceUnavailableException("error.productImage.unavailable");
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
        if (images.existsByFullKey(oldKey) || images.existsByThumbKey(oldKey) || images.existsBySmallKey(oldKey)) return;
        // A rolled back transaction still points at the old file, so it may only go once the new keys are committed.
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    delete(oldKey);
                }
            });
        } else {
            delete(oldKey);
        }
    }

    private void delete(String key) {
        try {
            store.delete(key);
        } catch (RuntimeException e) {
            // An orphaned file costs a few kilobytes; failing the admin's crop over it would cost more.
            log.warn("Could not delete replaced product photo {}", key, e);
        }
    }

    private record Copy(String fullKey, String thumbKey, String smallKey, int width, int height) {
    }
}
