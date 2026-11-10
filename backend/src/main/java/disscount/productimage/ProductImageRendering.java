package disscount.productimage;

import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;

import disscount.productimage.openfoodfacts.OffImageUrls;
import disscount.productimage.openfoodfacts.OpenFoodFactsClient;
import disscount.productimage.render.ProductImageRenderer;
import disscount.productimage.render.ProductImageRenderer.Crop;
import disscount.productimage.render.ProductImageRenderer.Rendered;
import disscount.shared.BadRequestException;
import disscount.shared.NotFoundException;
import disscount.shared.PhotoStore;
import disscount.shared.PhotoStoreConfig;
import disscount.shared.ServiceUnavailableException;
import disscount.shared.StoredPhoto;
import disscount.shared.Timestamps;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** Renders a photo from its untouched source, so a new crop never compounds an earlier one. */
@Component
@RequiredArgsConstructor
public class ProductImageRendering {

    private static final Logger log = LoggerFactory.getLogger(ProductImageRendering.class);
    private static final String WEBP = "image/webp";

    @Qualifier(PhotoStoreConfig.PRODUCT_PHOTOS)
    private final PhotoStore store;
    @Qualifier(PhotoStoreConfig.PRODUCT_ORIGINALS)
    private final PhotoStore originals;
    private final OpenFoodFactsClient off;
    private final ProductImageRepository images;

    public void render(ProductImage image) {
        apply(image, upload(image));
    }

    /** Downloads take seconds, so it writes onto the current row and drops its copy if the photo changed meanwhile. */
    public void renderCandidate(ProductImage loaded) {
        Copy copy = upload(loaded);
        ProductImage current = images.findById(loaded.getId())
                .filter(i -> stillWaiting(i, loaded) && sameFraming(i, loaded))
                .orElse(null);
        if (current == null) {
            deleteIfUnused(copy.fullKey(), null);
            deleteIfUnused(copy.smallKey(), null);
            return;
        }
        current.setRenderAttempts(null);
        current.setRenderRetryAt(null);
        apply(current, copy);
    }

    /** Renders a shown photo again from its source, dropping the result if an admin reframed or replaced it. */
    public void rerender(ProductImage loaded) {
        Copy copy = upload(loaded);
        ProductImage current = images.findById(loaded.getId())
                .filter(i -> Objects.equals(i.getFullKey(), loaded.getFullKey()) && sameFraming(i, loaded))
                .orElse(null);
        if (current == null) {
            deleteIfUnused(copy.fullKey(), null);
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
        Rendered rendered = render(source(image), image.getRotation(), crop, image);
        if (rendered.overCeiling()) {
            log.info("Product photo {} for {} stays over its size ceiling at the lowest quality: full {}, small {} bytes",
                    image.getId(), image.getEan(), rendered.full().length, rendered.small().length);
        }

        String base = PhotoStoreConfig.PRODUCTS_FOLDER + "/" + image.getEan() + "/" + rendered.sha256().substring(0, 20);
        Copy copy = new Copy(base + ".webp", base + "-small.webp", rendered.fullWidth(), rendered.fullHeight(),
                rendered.sourceWidth(), rendered.sourceHeight());
        store.put(copy.fullKey(), rendered.full(), WEBP);
        store.put(copy.smallKey(), rendered.small(), WEBP);
        return copy;
    }

    private void apply(ProductImage image, Copy copy) {
        String oldFull = image.getFullKey();
        String oldThumb = image.getThumbKey();
        String oldSmall = image.getSmallKey();
        image.setFullKey(copy.fullKey());
        image.setThumbKey(null);
        image.setSmallKey(copy.smallKey());
        image.setFullWidth(copy.fullWidth());
        image.setFullHeight(copy.fullHeight());
        image.setRenderedAt(Timestamps.nowUtc());
        image.setOriginalWidth(copy.width());
        image.setOriginalHeight(copy.height());
        if (image.getStatus() == ImageStatus.CANDIDATE) {
            image.setStatus(ImageStatus.VERIFIED);
        }
        images.save(image);

        deleteIfUnused(oldFull, copy.fullKey());
        deleteIfUnused(oldThumb, null);
        deleteIfUnused(oldSmall, copy.smallKey());
    }

    /** The renderer only reads the bytes it is given, so an unexpected failure is this photo's, not an outage. */
    private static Rendered render(byte[] source, int rotation, Crop crop, ProductImage image) {
        try {
            return ProductImageRenderer.render(source, rotation, crop);
        } catch (BadRequestException e) {
            throw e;
        } catch (RuntimeException e) {
            log.warn("Product photo {} for {} could not be rendered", image.getId(), image.getEan(), e);
            throw new PhotoRenderFailedException(e);
        }
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
        // A kept photo of an erased user has no original left to crop from.
        if (image.getOriginalKey() == null) throw new NotFoundException("error.productImage.notFound");
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

    /** Deletes a deleted photo's public files once no other row points at them; call after clearing the row's keys. */
    void dropFiles(String fullKey, String thumbKey, String smallKey) {
        deleteIfUnused(fullKey, null);
        deleteIfUnused(thumbKey, null);
        deleteIfUnused(smallKey, null);
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

    /** Fails the erasure on failure, so an erased account's file cannot stay public; call after deleting the row. */
    void eraseFiles(String fullKey, String thumbKey, String smallKey) {
        for (String key : new String[]{fullKey, thumbKey, smallKey}) {
            if (key == null) continue;
            if (images.existsByFullKey(key) || images.existsByThumbKey(key) || images.existsBySmallKey(key)) continue;
            store.delete(key);
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

    /** width and height are the source photo's, kept on the row as original_width and original_height. */
    private record Copy(String fullKey, String smallKey, int fullWidth, int fullHeight, int width, int height) {
    }
}
