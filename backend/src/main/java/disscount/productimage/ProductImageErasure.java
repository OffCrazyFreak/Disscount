package disscount.productimage;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** A photo someone else confirmed stays as product data, minus author and private original; the rest goes (#486). */
@Service
@RequiredArgsConstructor
public class ProductImageErasure {

    private final ProductImageRepository images;
    private final ProductImageSetRepository sets;
    private final ProductImageReportRepository reports;
    private final ProductImageRendering rendering;
    private final ProductImageRemoval removal;

    @Transactional
    public void eraseContributor(UUID userId) {
        Set<String> eansToRepick = new HashSet<>();
        for (ProductImage image : images.findByContributorId(userId)) {
            // A photo an admin hid was rejected, so it goes even if someone had confirmed it.
            if (image.getStatus() == ImageStatus.VERIFIED && !image.isDeleted()) {
                keepWithoutAuthor(image);
            } else if (image.isDeleted()) {
                // An admin's tombstone keeps blocking the photo; only the link to the person goes.
                image.setContributorId(null);
                images.save(image);
            } else {
                deleteEntirely(image);
                eansToRepick.add(image.getEan());
            }
        }

        for (ProductImage image : images.findByConfirmedById(userId)) {
            image.setConfirmedById(null);
            images.save(image);
        }

        withdrawReports(reports.findByUserId(userId));
        eansToRepick.forEach(this::repickMainIfGone);
    }

    private void keepWithoutAuthor(ProductImage image) {
        String original = image.getOriginalKey();
        image.setContributorId(null);
        // The original may show more than the product; the admin re-uploads to re-crop a kept photo.
        image.setOriginalKey(null);
        images.save(image);
        removal.eraseOriginal(original);
    }

    private void deleteEntirely(ProductImage image) {
        reports.deleteByImageId(image.getId());
        images.delete(image);
        rendering.eraseFiles(image.getFullKey(), image.getThumbKey(), image.getSmallKey());
        removal.eraseOriginal(image.getOriginalKey());
    }

    private void withdrawReports(List<ProductImageReport> own) {
        for (ProductImageReport report : own) {
            images.findById(report.getImageId()).ifPresent(image -> {
                image.setReportCount(Math.max(0, image.getReportCount() - 1));
                if (image.getReportCount() == 0) image.setFlaggedAt(null);
                images.save(image);
            });
        }
        reports.deleteAll(own);
    }

    private void repickMainIfGone(String ean) {
        sets.findById(ean).ifPresent(set -> {
            if (set.getMainImageId() == null || images.existsById(set.getMainImageId())) return;
            set.setPinned(false);
            // The shown photo changed without an admin, so the product goes back to the review queue.
            set.setNeedsReview(true);
            set.setMainImageId(MainPicker.pick(images.findByEanOrderByCreatedAtAsc(ean))
                    .map(ProductImage::getId).orElse(null));
            sets.save(set);
        });
    }
}
