package disscount.productimage.jobs;

import java.util.UUID;

import disscount.productimage.HiddenReason;
import disscount.productimage.ImageSource;
import disscount.productimage.ImageStatus;
import disscount.productimage.ProductImage;
import disscount.productimage.ProductImageRepository;
import disscount.productimage.ProductImageSet;
import disscount.productimage.ProductImageSetRepository;
import disscount.productimage.catalog.CatalogImportService;
import disscount.productimage.openfoodfacts.OffImageGoneException;
import disscount.productimage.openfoodfacts.OffImageUnavailableException;
import disscount.productimage.openfoodfacts.OpenFoodFactsClient;
import disscount.productimage.render.ProductImageRendering;
import disscount.shared.photo.FakePhotoStore;
import disscount.shared.photo.PhotoStoreConfig;
import disscount.shared.photo.TestImages;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/** An admin may act on a photo while the job is still downloading it; the job must not write its stale copy back. */
@DataJpaTest(showSql = false, properties = "product-images.jobs.enabled=true")
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({ProductImageJobs.class, ProductImageRendering.class, ProductImageJobsRenderTest.StoreConfig.class})
class ProductImageJobsStaleWriteTest {

    static final String EAN = "8076800195057";

    @Autowired ProductImageJobs jobs;
    @Autowired ProductImageRepository images;
    @Autowired ProductImageSetRepository sets;
    @Autowired @Qualifier(PhotoStoreConfig.PRODUCT_PHOTOS) FakePhotoStore publicStore;
    @MockitoBean OpenFoodFactsClient off;
    @MockitoBean CatalogImportService catalog;
    @MockitoBean OffSeedService seed;

    UUID photoId;

    @BeforeEach
    void setUp() {
        images.deleteAll();
        sets.deleteAll();
        publicStore.objects.clear();
        photoId = images.save(ProductImage.builder().ean(EAN).source(ImageSource.OPEN_FOOD_FACTS)
                .status(ImageStatus.CANDIDATE).externalKey("front_hr").externalRev("4").lang("hr")
                .renderAttempts(2).build()).getId();
        sets.save(ProductImageSet.builder().ean(EAN).storeListings(900).mainImageId(photoId).build());
    }

    @Test
    void aGoneDownloadDoesNotTurnAnAdminHideIntoAJobSkip() {
        when(off.download(anyString())).thenAnswer(call -> {
            adminHides();
            throw new OffImageGoneException("url", 404);
        });

        jobs.renderMainPhotos();

        assertAdminHideStands();
    }

    @Test
    void aRefusedDownloadDoesNotUndoAnAdminHide() {
        when(off.download(anyString())).thenAnswer(call -> {
            adminHides();
            throw new OffImageUnavailableException("url", 403);
        });

        jobs.renderMainPhotos();

        assertAdminHideStands();
        assertThat(images.findById(photoId)).get().satisfies(i -> {
            assertThat(i.getRenderAttempts()).isEqualTo(2);
            assertThat(i.getRenderRetryAt()).isNull();
        });
    }

    @Test
    void aFinishedCopyDoesNotPublishAPhotoAnAdminHid() {
        when(off.download(anyString())).thenAnswer(call -> {
            adminHides();
            return TestImages.jpeg(300, 200);
        });

        jobs.renderMainPhotos();

        assertAdminHideStands();
        assertThat(images.findById(photoId)).get().extracting(ProductImage::isRendered).isEqualTo(false);
        assertThat(publicStore.objects).isEmpty();
    }

    @Test
    void aCopiedPhotoForgetsItsEarlierFailedAttempts() {
        when(off.download(anyString())).thenReturn(TestImages.jpeg(300, 200));

        jobs.renderMainPhotos();

        assertThat(images.findById(photoId)).get().satisfies(i -> {
            assertThat(i.getStatus()).isEqualTo(ImageStatus.VERIFIED);
            assertThat(i.getRenderAttempts()).isNull();
        });
    }

    private void adminHides() {
        ProductImage image = images.findById(photoId).orElseThrow();
        image.setStatus(ImageStatus.HIDDEN);
        image.setHiddenReason(HiddenReason.ADMIN);
        images.save(image);
    }

    private void assertAdminHideStands() {
        assertThat(images.findById(photoId)).get().satisfies(i -> {
            assertThat(i.getStatus()).isEqualTo(ImageStatus.HIDDEN);
            assertThat(i.getHiddenReason()).isEqualTo(HiddenReason.ADMIN);
            assertThat(i.getRenderedAt()).isNull();
        });
    }
}
