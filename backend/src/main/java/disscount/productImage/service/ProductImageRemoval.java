package disscount.productImage.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;

import disscount.exceptions.BadRequestException;
import disscount.productImage.dao.ProductImageReportRepository;
import disscount.productImage.dao.ProductImageRepository;
import disscount.productImage.domain.HiddenReason;
import disscount.productImage.domain.ImageStatus;
import disscount.productImage.domain.ProductImage;
import disscount.productImage.render.ProductImageRenderer;
import disscount.storage.PhotoStore;
import disscount.storage.PhotoStoreConfig;
import disscount.storage.StoredPhoto;
import disscount.util.Timestamps;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** Deleting a photo removes its files but keeps the row, whose fingerprint and Open Food Facts key keep it from coming back. */
@Component
@RequiredArgsConstructor
class ProductImageRemoval {

    private static final Logger log = LoggerFactory.getLogger(ProductImageRemoval.class);

    private final ProductImageRepository images;
    private final ProductImageReportRepository reports;
    private final ProductImageRendering rendering;
    @Qualifier(PhotoStoreConfig.PRODUCT_ORIGINALS)
    private final PhotoStore originals;

    /** Runs inside the caller's transaction. */
    void delete(UUID adminId, ProductImage image) {
        if (image.getContentSha256() == null) image.setContentSha256(fingerprintOfOriginal(image.getOriginalKey()));

        String full = image.getFullKey();
        String thumb = image.getThumbKey();
        String small = image.getSmallKey();
        String original = image.getOriginalKey();

        image.setStatus(ImageStatus.HIDDEN);
        image.setHiddenReason(HiddenReason.ADMIN);
        image.setDeletedAt(Timestamps.nowUtc());
        image.setDeletedById(adminId);
        image.setFullKey(null);
        image.setThumbKey(null);
        image.setSmallKey(null);
        image.setOriginalKey(null);
        image.setRenderedAt(null);
        image.setReportCount(0);
        image.setFlaggedAt(null);
        images.save(image);
        reports.deleteByImageId(image.getId());

        rendering.dropFiles(full, thumb, small);
        if (original != null) afterCommit(() -> deleteOriginal(original));
    }

    /**
     * Refuses a photo an admin deleted. Both the uploaded bytes and the cleaned copy are checked, because
     * photos uploaded before fingerprints existed only have the cleaned copy to hash.
     */
    void requireNotDeleted(byte[] uploaded, byte[] cleaned) {
        List<String> hashes = List.of(ProductImageRenderer.sha256(uploaded), ProductImageRenderer.sha256(cleaned));
        if (images.existsByContentSha256InAndDeletedAtIsNotNull(hashes)) {
            throw new BadRequestException("error.productImage.deleted");
        }
    }

    private String fingerprintOfOriginal(String originalKey) {
        if (originalKey == null || !originals.enabled()) return null;
        return originals.get(originalKey).map(stored -> {
            try (StoredPhoto photo = stored; InputStream in = photo.stream()) {
                return ProductImageRenderer.sha256(in.readAllBytes());
            } catch (IOException e) {
                log.warn("Could not fingerprint the original {} before deleting it", originalKey, e);
                return null;
            }
        }).orElse(null);
    }

    private void deleteOriginal(String key) {
        try {
            originals.delete(key);
        } catch (RuntimeException e) {
            log.warn("Could not delete the original of a deleted product photo {}", key, e);
        }
    }

    // A rolled back deletion still points at the original, so the file may only go after the commit.
    private static void afterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }
}
