package disscount.productImage.service;

import java.util.List;

import disscount.digitalCard.photo.TestImages;
import disscount.digitalCard.service.FakePhotoStore;
import disscount.productImage.FakeProductImageStore;
import disscount.productImage.catalog.CatalogImportService;
import disscount.productImage.dao.ProductImageRepository;
import disscount.productImage.dao.ProductImageSetRepository;
import disscount.productImage.domain.ImageSource;
import disscount.productImage.domain.ImageStatus;
import disscount.productImage.domain.ProductImage;
import disscount.productImage.domain.ProductImageSet;
import disscount.productImage.off.OffImageGoneException;
import disscount.productImage.off.OffImageUnavailableException;
import disscount.productImage.off.OpenFoodFactsClient;
import disscount.util.Timestamps;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@DataJpaTest(showSql = false, properties = "product-images.jobs.enabled=true")
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({ProductImageJobs.class, ProductImageRendering.class, ProductImageJobsRenderTest.StoreConfig.class})
class ProductImageJobsRenderTest {

    static final String WIDELY_SOLD = "8076800195057";
    static final String LESS_SOLD = "5449000000996";

    @TestConfiguration
    static class StoreConfig {
        @Bean
        FakePhotoStore photoStore() {
            return new FakePhotoStore();
        }

        @Bean
        FakeProductImageStore productImageStore() {
            return new FakeProductImageStore();
        }
    }

    @Autowired ProductImageJobs jobs;
    @Autowired ProductImageRepository images;
    @Autowired ProductImageSetRepository sets;
    @Autowired FakeProductImageStore publicStore;
    @MockBean OpenFoodFactsClient off;
    @MockBean CatalogImportService catalog;
    @MockBean OffSeedService seed;
    @MockBean ProductPhotoUploadLimiter limiter;

    @BeforeEach
    void setUp() {
        images.deleteAll();
        sets.deleteAll();
        publicStore.objects.clear();
    }

    @Test
    void aRefusedPhotoWaitsWhileTheRestOfTheQueueIsCopied() {
        ProductImage refused = mainCandidate(WIDELY_SOLD, 900);
        ProductImage next = mainCandidate(LESS_SOLD, 40);
        when(off.download(contains("/807/680/019/5057/"))).thenThrow(new OffImageUnavailableException("url", 403));
        when(off.download(contains("/544/900/000/0996/"))).thenReturn(TestImages.jpeg(300, 200));

        jobs.renderMainPhotos();

        assertThat(images.findById(refused.getId())).get().satisfies(i -> {
            assertThat(i.getStatus()).isEqualTo(ImageStatus.CANDIDATE);
            assertThat(i.getRenderRetryAt()).isAfter(Timestamps.nowUtc());
        });
        assertThat(images.findById(next.getId())).get().satisfies(i -> {
            assertThat(i.getStatus()).isEqualTo(ImageStatus.VERIFIED);
            assertThat(i.isRendered()).isTrue();
        });
    }

    @Test
    void aPostponedPhotoIsTriedAgainOnlyOnceItsWaitIsOver() {
        ProductImage failing = mainCandidate(WIDELY_SOLD, 900);
        when(off.download(anyString())).thenThrow(new OffImageUnavailableException("url", 500));

        jobs.renderMainPhotos();
        jobs.renderMainPhotos();
        verify(off, times(1)).download(anyString());

        ProductImage postponed = images.findById(failing.getId()).orElseThrow();
        postponed.setRenderRetryAt(Timestamps.nowUtc().minusMinutes(1));
        images.save(postponed);
        jobs.renderMainPhotos();
        verify(off, times(2)).download(anyString());
    }

    @Test
    void networkTroublePausesTheQueueWithoutMarkingAnyPhoto() {
        ProductImage first = mainCandidate(WIDELY_SOLD, 900);
        ProductImage second = mainCandidate(LESS_SOLD, 40);
        when(off.download(anyString())).thenThrow(new IllegalStateException("Image download failed"));

        jobs.renderMainPhotos();

        verify(off, times(1)).download(anyString());
        assertThat(images.findAllById(List.of(first.getId(), second.getId()))).allSatisfy(i -> {
            assertThat(i.getStatus()).isEqualTo(ImageStatus.CANDIDATE);
            assertThat(i.getRenderRetryAt()).isNull();
        });
    }

    @Test
    void aGonePhotoIsHiddenAndLosesItsMainSlot() {
        ProductImage gone = mainCandidate(WIDELY_SOLD, 900);
        when(off.download(anyString())).thenThrow(new OffImageGoneException("url", 404));

        jobs.renderMainPhotos();

        assertThat(images.findById(gone.getId())).get().extracting(ProductImage::getStatus).isEqualTo(ImageStatus.HIDDEN);
        assertThat(sets.findById(WIDELY_SOLD)).get().extracting(ProductImageSet::getMainImageId).isNull();
    }

    @Test
    void nothingRunsWhileTheBucketIsOff() {
        mainCandidate(WIDELY_SOLD, 900);
        publicStore.enabled = false;
        try {
            jobs.renderMainPhotos();
        } finally {
            publicStore.enabled = true;
        }

        verify(off, never()).download(anyString());
    }

    private ProductImage mainCandidate(String ean, int storeListings) {
        ProductImage image = images.save(ProductImage.builder().ean(ean).source(ImageSource.OPEN_FOOD_FACTS)
                .status(ImageStatus.CANDIDATE).externalKey("front_hr").externalRev("4").lang("hr").build());
        sets.save(ProductImageSet.builder().ean(ean).storeListings(storeListings).mainImageId(image.getId()).build());
        return image;
    }
}
