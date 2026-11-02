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
            // A copied photo keeps the revision it was rendered from; only an untouched candidate follows Open Food Facts.
            if (image.getStatus() == ImageStatus.CANDIDATE && rev != null && !rev.equals(image.getExternalRev())) {
                image.setExternalRev(rev);
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
