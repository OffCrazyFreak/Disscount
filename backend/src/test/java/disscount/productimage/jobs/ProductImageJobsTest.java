package disscount.productimage.jobs;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import disscount.productimage.ProductImageRepository;
import disscount.productimage.ProductImageSetRepository;
import disscount.productimage.catalog.CatalogImportResult;
import disscount.productimage.catalog.CatalogImportService;
import disscount.productimage.render.ProductImageRendering;
import disscount.shared.photo.FakePhotoStore;
import disscount.shared.Timestamps;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
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

    static final LocalDate ARCHIVE = LocalDate.of(2026, 11, 22);

    static CatalogImportResult imported(LocalDate archiveDate) {
        return new CatalogImportResult(archiveDate, 1, List.of("3850102101017"), List.of());
    }

    static ProductImageImportRun lastImport(LocalDate archiveDate) {
        return new ProductImageImportRun(ProductImageJobs.CATALOG_IMPORT, Timestamps.nowUtc().minusHours(5), archiveDate);
    }

    @Test
    void catalogueImportsWithoutThePhotoBucketButSkipsThePhotoSeed() throws Exception {
        store.enabled = false;
        when(catalog.importNewerThan(null)).thenReturn(Optional.of(imported(ARCHIVE)));

        jobs().importCatalogue();

        verify(seed, never()).seed();
        verify(runs).save(argThat(run -> ProductImageJobs.CATALOG_IMPORT.equals(run.getKind())));
    }

    @Test
    void photoSeedFollowsTheCatalogueWhenTheBucketIsOn() throws Exception {
        jobs().importCatalogue();

        verify(catalog).importNewerThan(null);
        verify(seed).seed();
    }

    @Test
    void photoSeedRunsOnceTheBucketTurnsOnEvenIfTheCatalogueIsCurrent() throws Exception {
        when(runs.findById(ProductImageJobs.CATALOG_IMPORT)).thenReturn(Optional.of(lastImport(ARCHIVE)));

        jobs().importCatalogue();

        verify(seed).seed();
        ArgumentCaptor<ProductImageImportRun> saved = ArgumentCaptor.forClass(ProductImageImportRun.class);
        verify(runs).save(saved.capture());
        assertEquals(ProductImageJobs.PHOTO_SEED, saved.getValue().getKind());
        assertTrue(saved.getValue().getFinishedAt().isAfter(Timestamps.nowUtc().minusMinutes(1)));

        when(runs.findById(ProductImageJobs.PHOTO_SEED)).thenReturn(Optional.of(saved.getValue()));
        jobs().importCatalogue();
        verify(seed).seed();
    }

    @Test
    void eachNewUpstreamDateIsImportedOnceAndRecordedBeforeTheEnginesHearOfIt() throws Exception {
        when(runs.findById(ProductImageJobs.CATALOG_IMPORT)).thenReturn(Optional.of(lastImport(ARCHIVE)));
        CatalogImportResult next = imported(ARCHIVE.plusDays(1));
        when(catalog.importNewerThan(ARCHIVE)).thenReturn(Optional.of(next));

        jobs().importCatalogue();

        InOrder order = inOrder(catalog, runs);
        order.verify(catalog).importNewerThan(ARCHIVE);
        order.verify(runs).save(argThat(run -> ProductImageJobs.CATALOG_IMPORT.equals(run.getKind())
                && ARCHIVE.plusDays(1).equals(run.getArchiveDate())));
        order.verify(catalog).announce(next);
    }

    @Test
    void anArchiveDateAlreadyImportedRecordsAndAnnouncesNothing() throws Exception {
        when(runs.findById(any())).thenReturn(Optional.of(lastImport(ARCHIVE)));

        jobs().importCatalogue();

        verify(catalog).importNewerThan(ARCHIVE);
        verify(catalog, never()).announce(any());
        verify(runs, never()).save(argThat(run -> ProductImageJobs.CATALOG_IMPORT.equals(run.getKind())));
    }

    @Test
    void theHourlyCatalogueCheckLeavesTheWeeklySeedAlone() throws Exception {
        when(runs.findById(ProductImageJobs.PHOTO_SEED)).thenReturn(Optional.of(
                new ProductImageImportRun(ProductImageJobs.PHOTO_SEED, Timestamps.nowUtc().minusDays(2), null)));

        jobs().importCatalogue();

        verify(seed, never()).seed();
    }

    @Test
    void aFailedCatalogueImportStillSeedsWhenTheSeedIsDue() throws Exception {
        doThrow(new IllegalStateException("upstream down")).when(catalog).importNewerThan(any());

        jobs().importCatalogue();

        verify(seed).seed();
        verify(runs).save(argThat(run -> ProductImageJobs.PHOTO_SEED.equals(run.getKind())));
        verify(runs, never()).save(argThat(run -> ProductImageJobs.CATALOG_IMPORT.equals(run.getKind())));
    }

    @Test
    void anInterruptDuringTheCatalogueDownloadSkipsTheSeed() throws Exception {
        doAnswer(call -> {
            Thread.currentThread().interrupt();
            throw new java.io.InterruptedIOException("download interrupted");
        }).when(catalog).importNewerThan(any());

        try {
            jobs().importCatalogue();

            verify(seed, never()).seed();
            assertTrue(Thread.currentThread().isInterrupted());
        } finally {
            Thread.interrupted();
        }
    }
}
