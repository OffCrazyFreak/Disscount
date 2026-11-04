package disscount.productImage.service;

import java.util.List;

import disscount.digitalCard.photo.TestImages;
import disscount.productImage.catalog.CatalogImportService;
import disscount.productImage.dao.ProductImageRepository;
import disscount.productImage.dao.ProductImageSetRepository;
import disscount.productImage.domain.HiddenReason;
import disscount.productImage.domain.ImageSource;
import disscount.productImage.domain.ImageStatus;
import disscount.productImage.domain.ProductImage;
import disscount.productImage.domain.ProductImageSet;
import disscount.productImage.off.OffImageGoneException;
import disscount.productImage.off.OffImageUnavailableException;
import disscount.productImage.off.OpenFoodFactsClient;
import disscount.storage.FakePhotoStore;
import disscount.storage.PhotoStoreConfig;
import disscount.util.Timestamps;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
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
        FakePhotoStore productOriginalStore() {
            return new FakePhotoStore();
        }

        @Bean
        FakePhotoStore productImageStore() {
            return new FakePhotoStore();
        }
    }

    @Autowired ProductImageJobs jobs;
    @Autowired ProductImageRepository images;
    @Autowired ProductImageSetRepository sets;
    @Autowired @Qualifier(PhotoStoreConfig.PRODUCT_PHOTOS) FakePhotoStore publicStore;
    @MockitoBean OpenFoodFactsClient off;
    @MockitoBean CatalogImportService catalog;
    @MockitoBean OffSeedService seed;

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
    void aPhotoThatFailsFiveTimesIsSkippedSoTheNextPickTakesTheMainSlot() {
        ProductImage failing = mainCandidate(WIDELY_SOLD, 900);
        ProductImage english = images.save(ProductImage.builder().ean(WIDELY_SOLD).source(ImageSource.OPEN_FOOD_FACTS)
                .status(ImageStatus.CANDIDATE).externalKey("front_en").externalRev("7").lang("en").build());
        when(off.download(contains("front_hr"))).thenThrow(new OffImageUnavailableException("url", 403));

        for (int attempt = 1; attempt <= ProductImageJobs.MAX_RENDER_ATTEMPTS; attempt++) {
            if (attempt > 1) {
                ProductImage due = images.findById(failing.getId()).orElseThrow();
                due.setRenderRetryAt(Timestamps.nowUtc().minusMinutes(1));
                images.save(due);
            }
            assertThat(images.findById(failing.getId())).get().extracting(ProductImage::getStatus)
                    .isEqualTo(ImageStatus.CANDIDATE);
            jobs.renderMainPhotos();
        }

        assertThat(images.findById(failing.getId())).get().satisfies(i -> {
            assertThat(i.getStatus()).isEqualTo(ImageStatus.HIDDEN);
            assertThat(i.getHiddenReason()).isEqualTo(HiddenReason.JOB_SKIPPED);
            assertThat(i.getRenderAttempts()).isEqualTo(ProductImageJobs.MAX_RENDER_ATTEMPTS);
        });
        assertThat(sets.findById(WIDELY_SOLD)).get().extracting(ProductImageSet::getMainImageId).isEqualTo(english.getId());
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
    void rateLimitingPausesTheQueueInsteadOfPostponingEveryPhoto() {
        ProductImage first = mainCandidate(WIDELY_SOLD, 900);
        mainCandidate(LESS_SOLD, 40);
        when(off.download(anyString())).thenThrow(new OffImageUnavailableException("url", 429));

        jobs.renderMainPhotos();

        verify(off, times(1)).download(anyString());
        assertThat(images.findById(first.getId())).get().extracting(ProductImage::getRenderRetryAt).isNull();
    }

    @Test
    void aGonePhotoIsHiddenAndLosesItsMainSlot() {
        ProductImage gone = mainCandidate(WIDELY_SOLD, 900);
        when(off.download(anyString())).thenThrow(new OffImageGoneException("url", 404));

        jobs.renderMainPhotos();

        assertThat(images.findById(gone.getId())).get().satisfies(i -> {
            assertThat(i.getStatus()).isEqualTo(ImageStatus.HIDDEN);
            assertThat(i.getHiddenReason()).isEqualTo(HiddenReason.JOB_SKIPPED);
        });
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

    @Test
    void anOlderJpegPhotoIsRenderedAgainAsWebpOnceNoNewPhotoWaits() {
        ProductImage older = renderedJpegMain(WIDELY_SOLD);
        when(off.download(anyString())).thenReturn(TestImages.jpeg(600, 400));

        jobs.renderMainPhotos();

        ProductImage after = images.findById(older.getId()).orElseThrow();
        assertThat(after.getFullKey()).endsWith(".webp");
        assertThat(after.getSmallKey()).endsWith("-small.webp");
        assertThat(publicStore.objects).doesNotContainKeys(older.getFullKey(), older.getThumbKey()).hasSize(3);
    }

    @Test
    void olderPhotosWaitWhileANewPhotoIsStillToBeCopied() {
        ProductImage older = renderedJpegMain(WIDELY_SOLD);
        mainCandidate(LESS_SOLD, 40);
        when(off.download(anyString())).thenReturn(TestImages.jpeg(600, 400));

        jobs.renderMainPhotos();

        assertThat(images.findById(older.getId()).orElseThrow().getSmallKey()).isNull();
    }

    @Test
    void anOlderPhotoWhoseSourceIsGoneKeepsItsFilesAndIsTriedAgainLater() {
        ProductImage older = renderedJpegMain(WIDELY_SOLD);
        when(off.download(anyString())).thenThrow(new OffImageGoneException("url", 404));

        jobs.renderMainPhotos();

        ProductImage after = images.findById(older.getId()).orElseThrow();
        assertThat(after.getFullKey()).isEqualTo(older.getFullKey());
        assertThat(after.getStatus()).isEqualTo(ImageStatus.VERIFIED);
        assertThat(after.getRenderAttempts()).isEqualTo(1);
        assertThat(after.getRenderRetryAt()).isAfter(Timestamps.nowUtc());
        assertThat(publicStore.objects).containsKeys(older.getFullKey(), older.getThumbKey());
    }

    /** A main photo copied before WebP: JPEG keys and no small list file. */
    private ProductImage renderedJpegMain(String ean) {
        String base = "products/" + ean + "/0123456789abcdef0123";
        ProductImage image = images.save(ProductImage.builder().ean(ean).source(ImageSource.OPEN_FOOD_FACTS)
                .status(ImageStatus.VERIFIED).externalKey("front_hr").externalRev("4").lang("hr")
                .fullKey(base + ".jpg").thumbKey(base + "-thumb.jpg").renderedAt(Timestamps.nowUtc()).build());
        sets.save(ProductImageSet.builder().ean(ean).storeListings(500).mainImageId(image.getId()).build());
        publicStore.objects.put(image.getFullKey(), new byte[] {1});
        publicStore.objects.put(image.getThumbKey(), new byte[] {1});
        return image;
    }

    private ProductImage mainCandidate(String ean, int storeListings) {
        ProductImage image = images.save(ProductImage.builder().ean(ean).source(ImageSource.OPEN_FOOD_FACTS)
                .status(ImageStatus.CANDIDATE).externalKey("front_hr").externalRev("4").lang("hr").build());
        sets.save(ProductImageSet.builder().ean(ean).storeListings(storeListings).mainImageId(image.getId()).build());
        return image;
    }
}
