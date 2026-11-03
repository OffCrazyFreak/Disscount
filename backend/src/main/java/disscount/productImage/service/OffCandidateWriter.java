package disscount.productImage.service;

import java.util.Optional;

import disscount.productImage.dao.ProductImageRepository;
import disscount.productImage.domain.ImageSource;
import disscount.productImage.domain.ImageStatus;
import disscount.productImage.domain.ProductImage;
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
            if (image.getStatus() == ImageStatus.CANDIDATE || image.getStatus() == ImageStatus.HIDDEN) {
                // A new revision is a different photo, so one hidden as unreadable or rejected gets a fresh chance.
                image.setExternalRev(rev);
                image.setStatus(ImageStatus.CANDIDATE);
                image.setRenderRetryAt(null);
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
