package disscount.productimage;

import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class OffCandidateWriter {

    private final ProductImageRepository images;

    void upsert(String ean, String externalKey, String rev, String lang) {
        Optional<ProductImage> existing = images.findByEanAndSourceAndExternalKey(ean, ImageSource.OPEN_FOOD_FACTS, externalKey);
        if (existing.isPresent()) {
            ProductImage image = existing.get();
            // A copied photo keeps the revision it was rendered from; one not copied yet follows Open Food Facts.
            if (image.isRendered() || rev == null || rev.equals(image.getExternalRev())) return;
            boolean skippedByJob = image.getStatus() == ImageStatus.HIDDEN
                    && image.getHiddenReason() == HiddenReason.JOB_SKIPPED;
            if (image.getStatus() == ImageStatus.CANDIDATE || skippedByJob) {
                // A new revision is a different file, so one the job could not copy gets a new try; a rejection stays.
                image.setExternalRev(rev);
                image.setStatus(ImageStatus.CANDIDATE);
                image.setHiddenReason(null);
                image.setRenderRetryAt(null);
                image.setRenderAttempts(null);
                images.save(image);
            }
            return;
        }
        images.save(ProductImage.builder()
                .ean(ean)
                .source(ImageSource.OPEN_FOOD_FACTS)
                .status(ImageStatus.CANDIDATE)
                .externalKey(externalKey)
                .externalRev(rev)
                .lang(lang)
                .build());
    }
}
