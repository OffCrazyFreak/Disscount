package disscount.productimage;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import disscount.productimage.openfoodfacts.OffProductPhotos;

final class MainPicker {

    private MainPicker() {}

    /** Users see verified photos, and an unconfirmed one only while it is the main photo. */
    static boolean isShown(ProductImage image, UUID mainId) {
        if (!image.isRendered()) return false;
        return image.getStatus() == ImageStatus.VERIFIED
                || (image.getStatus() == ImageStatus.PENDING && image.getId().equals(mainId));
    }

    /** Croatian front first, then English, then any front; user photos only when no front exists. */
    static Optional<ProductImage> pick(List<ProductImage> images) {
        return images.stream()
                .filter(i -> rank(i) < Integer.MAX_VALUE)
                .min(Comparator.comparingInt(MainPicker::rank).thenComparing(ProductImage::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())));
    }

    private static int rank(ProductImage image) {
        ImageStatus status = image.getStatus();
        if (status == ImageStatus.HIDDEN) return Integer.MAX_VALUE;

        boolean front = image.getSource() == ImageSource.OPEN_FOOD_FACTS
                && image.getExternalKey() != null && image.getExternalKey().startsWith("front_");
        int lang = OffProductPhotos.langRank(image.getLang());

        if (image.getSource() == ImageSource.ADMIN && image.isRendered()) return 0;
        if (front && status == ImageStatus.VERIFIED && image.isRendered()) return 1 + lang;
        if (image.getSource() == ImageSource.USER && status == ImageStatus.VERIFIED && image.isRendered()) return 4;
        // Not copied yet: the background job renders a main photo in this state.
        if (front && status == ImageStatus.CANDIDATE) return 5 + lang;
        if (image.getSource() == ImageSource.USER && status == ImageStatus.PENDING && image.isRendered()) return 8;
        return Integer.MAX_VALUE;
    }
}
