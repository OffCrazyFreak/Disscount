package disscount.productImage.service;

import disscount.productImage.FakeProductImageStore;
import disscount.productImage.catalog.CatalogImportService;
import disscount.productImage.dao.ProductImageImportRunRepository;
import disscount.productImage.dao.ProductImageRepository;
import disscount.productImage.dao.ProductImageSetRepository;
import org.junit.jupiter.api.Test;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class ProductImageJobsTest {

    final CatalogImportService catalog = mock(CatalogImportService.class);
    final OffSeedService seed = mock(OffSeedService.class);
    final ProductImageImportRunRepository runs = mock(ProductImageImportRunRepository.class);
    final FakeProductImageStore store = new FakeProductImageStore();

    ProductImageJobs jobs() {
        return new ProductImageJobs(true, store, catalog, seed, mock(ProductImageRendering.class),
                mock(ProductImageRepository.class), mock(ProductImageSetRepository.class), runs,
                mock(ProductPhotoUploadLimiter.class));
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
}
