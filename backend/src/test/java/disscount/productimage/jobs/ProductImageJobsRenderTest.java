package disscount.productimage.jobs;

import java.util.List;

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
import disscount.productimage.render.ProductImageRenderer;
import disscount.productimage.render.ProductImageRendering;
import disscount.shared.FakePhotoStore;
import disscount.shared.PhotoStoreConfig;
import disscount.shared.TestImages;
import disscount.shared.Timestamps;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.CALLS_REAL_METHODS;
import static org.mockito.Mockito.mockStatic;
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
    static final String RARELY_SOLD = "3017620422003";

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
    void anOlderPhotoIsRenderedAgainAtTheCurrentSizesOnceNoNewPhotoWaits() {
        ProductImage older = renderedJpegMain(WIDELY_SOLD);
        when(off.download(anyString())).thenReturn(TestImages.jpeg(600, 400));

        jobs.renderMainPhotos();

        ProductImage after = images.findById(older.getId()).orElseThrow();
        assertThat(after.getFullKey()).endsWith(".webp");
        assertThat(after.getSmallKey()).endsWith("-small.webp");
        // The 400 pixel file is gone, and the full one keeps the 600 x 400 source's shape.
        assertThat(after.getThumbKey()).isNull();
        assertThat(after.getFullWidth()).isEqualTo(600);
        assertThat(after.getFullHeight()).isEqualTo(400);
        assertThat(publicStore.objects).doesNotContainKeys(older.getFullKey(), older.getThumbKey()).hasSize(2);
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

    // A renderer fault repeats on the same bytes, so it must cost that photo a try, not stop the queue at it.
    @Test
    void aPhotoTheRendererFailsOnWaitsWhileTheRestOfTheQueueIsCopied() {
        ProductImage failing = mainCandidate(WIDELY_SOLD, 900);
        ProductImage next = mainCandidate(LESS_SOLD, 40);
        when(off.download(anyString())).thenReturn(TestImages.jpeg(600, 400));

        try (MockedStatic<ProductImageRenderer> renderer = mockStatic(ProductImageRenderer.class, CALLS_REAL_METHODS)) {
            renderer.when(() -> ProductImageRenderer.render(any(), anyInt(), any()))
                    .thenThrow(new IllegalStateException("WebP encoding failed"))
                    .thenCallRealMethod();
            jobs.renderMainPhotos();
        }

        assertThat(images.findById(failing.getId())).get().satisfies(i -> {
            assertThat(i.getStatus()).isEqualTo(ImageStatus.CANDIDATE);
            assertThat(i.getRenderAttempts()).isEqualTo(1);
            assertThat(i.getRenderRetryAt()).isNotNull();
        });
        assertThat(images.findById(next.getId())).get().extracting(ProductImage::isRendered).isEqualTo(true);
    }

    // A broken encoder fails every photo, and charging each one a try would end with every main photo hidden.
    @Test
    void aRendererThatFailsTwiceInARowPausesTheQueueWithoutChargingAnyPhoto() {
        ProductImage first = mainCandidate(WIDELY_SOLD, 900);
        ProductImage second = mainCandidate(LESS_SOLD, 40);
        when(off.download(anyString())).thenReturn(TestImages.jpeg(600, 400));

        try (MockedStatic<ProductImageRenderer> renderer = mockStatic(ProductImageRenderer.class, CALLS_REAL_METHODS)) {
            renderer.when(() -> ProductImageRenderer.render(any(), anyInt(), any()))
                    .thenThrow(new IllegalStateException("No WebP writer"));
            jobs.renderMainPhotos();
        }

        assertThat(images.findAllById(List.of(first.getId(), second.getId()))).allSatisfy(i -> {
            assertThat(i.getStatus()).isEqualTo(ImageStatus.CANDIDATE);
            assertThat(i.getRenderAttempts()).isNull();
            assertThat(i.getRenderRetryAt()).isAfter(Timestamps.nowUtc());
        });
    }

    // Two bad photos at the head of the queue would otherwise pause it at them on every tick.
    @Test
    void twoPhotosTheRendererFailsOnStepAsideSoTheNextOneIsCopied() {
        ProductImage first = mainCandidate(WIDELY_SOLD, 900);
        ProductImage second = mainCandidate(LESS_SOLD, 40);
        ProductImage good = mainCandidate(RARELY_SOLD, 5);
        byte[] unrenderable = TestImages.jpeg(601, 401);
        when(off.download(anyString())).thenReturn(unrenderable);
        when(off.download(contains("/301/762/042/2003/"))).thenReturn(TestImages.jpeg(600, 400));

        try (MockedStatic<ProductImageRenderer> renderer = failingOn(unrenderable)) {
            jobs.renderMainPhotos();
            jobs.renderMainPhotos();
        }

        assertThat(images.findById(good.getId())).get().extracting(ProductImage::isRendered).isEqualTo(true);
        assertThat(images.findAllById(List.of(first.getId(), second.getId()))).allSatisfy(i -> {
            assertThat(i.getStatus()).isEqualTo(ImageStatus.CANDIDATE);
            assertThat(i.getRenderAttempts()).isNull();
        });
    }

    @Test
    void photosThatFailTogetherAgainAfterTheirPauseAreChargedATry() {
        ProductImage first = mainCandidate(WIDELY_SOLD, 900);
        ProductImage second = mainCandidate(LESS_SOLD, 40);
        byte[] unrenderable = TestImages.jpeg(601, 401);
        when(off.download(anyString())).thenReturn(unrenderable);

        try (MockedStatic<ProductImageRenderer> renderer = failingOn(unrenderable)) {
            jobs.renderMainPhotos();
            makeDue(first, second);
            jobs.renderMainPhotos();
        }

        assertThat(images.findAllById(List.of(first.getId(), second.getId()))).allSatisfy(i -> {
            assertThat(i.getRenderAttempts()).isEqualTo(1);
            assertThat(i.getRenderRetryAt()).isAfter(Timestamps.nowUtc().plus(ProductImageJobs.RENDER_PAUSE));
        });
    }

    @Test
    void twoOlderPhotosTheRendererFailsOnStepAsideSoTheNextOneIsRenderedAgain() {
        ProductImage first = renderedJpegMain(WIDELY_SOLD);
        ProductImage second = renderedJpegMain(LESS_SOLD);
        ProductImage good = renderedJpegMain(RARELY_SOLD);
        sets.findById(RARELY_SOLD).ifPresent(set -> {
            set.setStoreListings(5);
            sets.save(set);
        });
        byte[] unrenderable = TestImages.jpeg(601, 401);
        when(off.download(anyString())).thenReturn(unrenderable);
        when(off.download(contains("/301/762/042/2003/"))).thenReturn(TestImages.jpeg(600, 400));

        try (MockedStatic<ProductImageRenderer> renderer = failingOn(unrenderable)) {
            jobs.renderMainPhotos();
            jobs.renderMainPhotos();
        }

        assertThat(images.findById(good.getId())).get().extracting(ProductImage::getFullWidth).isEqualTo(600);
        assertThat(images.findAllById(List.of(first.getId(), second.getId()))).allSatisfy(i -> {
            assertThat(i.getFullKey()).isNotNull();
            assertThat(i.getRenderAttempts()).isNull();
        });
    }

    @Test
    void anOlderPhotoTheRendererFailsOnKeepsItsFilesWhileTheNextOneIsRenderedAgain() {
        ProductImage failing = renderedJpegMain(WIDELY_SOLD);
        ProductImage next = renderedJpegMain(LESS_SOLD);
        sets.findById(LESS_SOLD).ifPresent(set -> {
            set.setStoreListings(40);
            sets.save(set);
        });
        when(off.download(anyString())).thenReturn(TestImages.jpeg(600, 400));

        try (MockedStatic<ProductImageRenderer> renderer = mockStatic(ProductImageRenderer.class, CALLS_REAL_METHODS)) {
            renderer.when(() -> ProductImageRenderer.render(any(), anyInt(), any()))
                    .thenThrow(new IllegalStateException("WebP encoding failed"))
                    .thenCallRealMethod();
            jobs.renderMainPhotos();
        }

        assertThat(images.findById(failing.getId())).get().satisfies(i -> {
            assertThat(i.getFullKey()).isEqualTo(failing.getFullKey());
            assertThat(i.getRenderAttempts()).isEqualTo(1);
            assertThat(i.getRenderRetryAt()).isNotNull();
        });
        assertThat(images.findById(next.getId())).get().extracting(ProductImage::getFullWidth).isEqualTo(600);
    }

    private static MockedStatic<ProductImageRenderer> failingOn(byte[] source) {
        MockedStatic<ProductImageRenderer> renderer = mockStatic(ProductImageRenderer.class, CALLS_REAL_METHODS);
        renderer.when(() -> ProductImageRenderer.render(eq(source), anyInt(), any()))
                .thenThrow(new IllegalStateException("WebP encoding failed"));
        return renderer;
    }

    private void makeDue(ProductImage... waiting) {
        for (ProductImage image : waiting) {
            ProductImage due = images.findById(image.getId()).orElseThrow();
            due.setRenderRetryAt(Timestamps.nowUtc().minusMinutes(1));
            images.save(due);
        }
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
