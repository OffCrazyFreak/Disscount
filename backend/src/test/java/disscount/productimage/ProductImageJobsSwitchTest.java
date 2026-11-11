package disscount.productimage;

import java.util.Optional;

import disscount.productimage.catalog.CatalogImportService;
import disscount.shared.FakePhotoStore;
import disscount.shared.PhotoStore;
import disscount.shared.PhotoStoreConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/** Binds product-images.jobs.enabled through Spring, since the other job tests build ProductImageJobs by hand. */
class ProductImageJobsSwitchTest {

    private final CatalogImportService catalog = mock(CatalogImportService.class);
    private final OffSeedService seed = mock(OffSeedService.class);
    private final ProductImageRendering rendering = mock(ProductImageRendering.class);
    private final ProductImageRepository images = mock(ProductImageRepository.class);
    private final ProductImageSetRepository sets = mock(ProductImageSetRepository.class);
    private final ProductImageImportRunRepository runs = mock(ProductImageImportRunRepository.class);

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withBean(PhotoStoreConfig.PRODUCT_PHOTOS, PhotoStore.class, FakePhotoStore::new)
            .withBean(CatalogImportService.class, () -> catalog)
            .withBean(OffSeedService.class, () -> seed)
            .withBean(ProductImageRendering.class, () -> rendering)
            .withBean(ProductImageRepository.class, () -> images)
            .withBean(ProductImageSetRepository.class, () -> sets)
            .withBean(ProductImageImportRunRepository.class, () -> runs)
            .withUserConfiguration(ProductImageJobs.class);

    @Test
    void anAbsentSwitchLeavesTheJobsOn() {
        when(runs.findById(anyString())).thenReturn(Optional.empty());

        runner.run(context -> {
            assertThat(context.getBean(ProductImageJobProperties.class).enabled()).isTrue();

            ProductImageJobs jobs = context.getBean(ProductImageJobs.class);
            jobs.weeklyImport();
            jobs.renderMainPhotos();

            verify(catalog).importLatest();
            verify(images).findUnrenderedMains(any(), any(), any());
        });
    }

    @Test
    void aFalseSwitchStopsBothJobs() {
        runner.withPropertyValues("product-images.jobs.enabled=false").run(context -> {
            assertThat(context.getBean(ProductImageJobProperties.class).enabled()).isFalse();

            ProductImageJobs jobs = context.getBean(ProductImageJobs.class);
            jobs.weeklyImport();
            jobs.renderMainPhotos();

            verifyNoInteractions(catalog, seed, rendering, images, sets, runs);
        });
    }
}
