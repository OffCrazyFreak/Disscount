package disscount.productimage.jobs;

import java.util.Optional;
import disscount.productimage.ProductImageRepository;
import disscount.productimage.ProductImageSetRepository;
import disscount.productimage.catalog.CatalogImportService;
import disscount.productimage.render.ProductImageRendering;
import disscount.shared.photo.FakePhotoStore;
import disscount.shared.Timestamps;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProductImageJobsTest {

    final CatalogImportService catalog = mock(CatalogImportService.class);
    final OffSeedService seed = mock(OffSeedService.class);
    final ProductImageImportRunRepository runs = mock(ProductImageImportRunRepository.class);
    final FakePhotoStore store = new FakePhotoStore();

    ProductImageJobs jobs() {
        return new ProductImageJobs(new ProductImageJobProperties(true), store, catalog, seed, mock(ProductImageRendering.class),
                mock(ProductImageRepository.class), mock(ProductImageSetRepository.class), runs);
    }

    @Test
    void catalogueImportsWithoutThePhotoBucketButSkipsThePhotoSeed() throws Exception {
        store.enabled = false;

        jobs().weeklyImport();

        verify(catalog).importLatest();
        verify(seed, never()).seed();
        verify(runs).save(any());
    }

    @Test
    void photoSeedFollowsTheCatalogueWhenTheBucketIsOn() throws Exception {
        jobs().weeklyImport();

        verify(catalog).importLatest();
        verify(seed).seed();
    }

    @Test
    void photoSeedRunsOnceTheBucketTurnsOnEvenIfTheCatalogueRanThisWeek() throws Exception {
        when(runs.findById(ProductImageJobs.WEEKLY_IMPORT)).thenReturn(Optional.of(
                new ProductImageImportRun(ProductImageJobs.WEEKLY_IMPORT, Timestamps.nowUtc().minusHours(5))));

        jobs().weeklyImport();

        verify(catalog, never()).importLatest();
        verify(seed).seed();
        ArgumentCaptor<ProductImageImportRun> saved = ArgumentCaptor.forClass(ProductImageImportRun.class);
        verify(runs).save(saved.capture());
        assertEquals(ProductImageJobs.PHOTO_SEED, saved.getValue().getKind());
        assertTrue(saved.getValue().getFinishedAt().isAfter(Timestamps.nowUtc().minusMinutes(1)));

        when(runs.findById(ProductImageJobs.PHOTO_SEED)).thenReturn(Optional.of(saved.getValue()));
        jobs().weeklyImport();
        verify(seed).seed();
    }

    @Test
    void aFreshCatalogueImportSeedsItsNewProductsEvenIfTheSeedRanThisWeek() throws Exception {
        when(runs.findById(ProductImageJobs.PHOTO_SEED)).thenReturn(Optional.of(
                new ProductImageImportRun(ProductImageJobs.PHOTO_SEED, Timestamps.nowUtc().minusDays(2))));

        jobs().weeklyImport();

        verify(catalog).importLatest();
        verify(seed).seed();
    }

    @Test
    void aFailedCatalogueImportStillSeedsWhenTheSeedIsDue() throws Exception {
        doThrow(new IllegalStateException("upstream down")).when(catalog).importLatest();

        jobs().weeklyImport();

        verify(seed).seed();
        verify(runs).save(argThat(run -> ProductImageJobs.PHOTO_SEED.equals(run.getKind())));
        verify(runs, never()).save(argThat(run -> ProductImageJobs.WEEKLY_IMPORT.equals(run.getKind())));
    }

    @Test
    void anInterruptDuringTheCatalogueDownloadSkipsTheSeed() throws Exception {
        doAnswer(call -> {
            Thread.currentThread().interrupt();
            throw new java.io.InterruptedIOException("download interrupted");
        }).when(catalog).importLatest();

        try {
            jobs().weeklyImport();

            verify(seed, never()).seed();
            assertTrue(Thread.currentThread().isInterrupted());
        } finally {
            Thread.interrupted();
        }
    }

    @Test
    void neitherRunsAgainWithinTheWeek() throws Exception {
        ProductImageImportRun recent = new ProductImageImportRun("x", Timestamps.nowUtc().minusDays(2));
        when(runs.findById(any())).thenReturn(Optional.of(recent));

        jobs().weeklyImport();

        verify(catalog, never()).importLatest();
        verify(seed, never()).seed();
    }
}
