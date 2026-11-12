package disscount.productimage;

import java.util.UUID;

import disscount.config.UploadLimitConfig;
import disscount.productimage.openfoodfacts.OpenFoodFactsClient;
import disscount.productimage.render.PhotoRenderFailedException;
import disscount.productimage.render.ProductImageRenderer;
import disscount.productimage.render.ProductImageRendering;
import disscount.shared.photo.FakePhotoStore;
import disscount.shared.photo.PhotoStoreConfig;
import disscount.shared.photo.PhotoValidator;
import disscount.shared.photo.TestImages;
import disscount.user.ActiveUsers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.CALLS_REAL_METHODS;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mockStatic;

// Erasure finds a contributor's files through their rows, so a failed upload must leave no file without one.
@DataJpaTest(showSql = false)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({ProductImageWriteService.class, ProductImageViews.class, ProductImageRendering.class, ProductImageRemoval.class,
        UploadLimitConfig.class, PhotoValidator.class, ProductImageUploadRollbackTest.StoreConfig.class})
class ProductImageUploadRollbackTest {

    static final String EAN = "8076800195057";

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

    @Autowired ProductImageWriteService writes;
    @Autowired ProductImageRepository images;
    @Autowired ProductImageSetRepository sets;
    @Autowired @Qualifier(PhotoStoreConfig.PRODUCT_ORIGINALS) FakePhotoStore originals;
    @Autowired @Qualifier(PhotoStoreConfig.PRODUCT_PHOTOS) FakePhotoStore publicStore;
    @MockitoSpyBean ProductImageViews views;
    @MockitoBean ActiveUsers activeUsers;
    @MockitoBean OpenFoodFactsClient off;

    final UUID ana = UUID.randomUUID();
    final UUID marko = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        images.deleteAll();
        sets.deleteAll();
        originals.objects.clear();
        publicStore.objects.clear();
    }

    @Test
    void anUploadTheRendererFailsOnLeavesNoOriginalBehind() {
        try (MockedStatic<ProductImageRenderer> renderer = mockStatic(ProductImageRenderer.class, CALLS_REAL_METHODS)) {
            renderer.when(() -> ProductImageRenderer.render(any(), anyInt(), any()))
                    .thenThrow(new IllegalStateException("WebP encoding failed"));

            assertThatThrownBy(() -> writes.upload(ana, EAN, jpeg())).isInstanceOf(PhotoRenderFailedException.class);
        }

        assertThat(images.count()).isZero();
        assertThat(originals.objects).isEmpty();
        assertThat(publicStore.objects).isEmpty();
    }

    @Test
    void anUploadThatFailsAfterRenderingLeavesNoFileBehind() {
        doThrow(new IllegalStateException("Connection lost")).when(views).publicView(anyString(), any(), anyList());

        assertThatThrownBy(() -> writes.upload(ana, EAN, jpeg())).isInstanceOf(IllegalStateException.class);

        assertThat(images.count()).isZero();
        assertThat(originals.objects).isEmpty();
        assertThat(publicStore.objects).isEmpty();
    }

    @Test
    void aFailedUploadOfTheSamePhotoKeepsTheFilesTheEarlierUploadUses() {
        writes.upload(ana, EAN, jpeg());
        ProductImage earlier = images.findByEanOrderByCreatedAtAsc(EAN).get(0);
        doThrow(new IllegalStateException("Connection lost")).when(views).publicView(anyString(), any(), anyList());

        assertThatThrownBy(() -> writes.upload(marko, EAN, jpeg())).isInstanceOf(IllegalStateException.class);

        assertThat(originals.objects).containsOnlyKeys(earlier.getOriginalKey());
        assertThat(publicStore.objects).containsOnlyKeys(earlier.getFullKey(), earlier.getSmallKey());
    }

    private static MockMultipartFile jpeg() {
        return new MockMultipartFile("photo", "p.jpg", "image/jpeg", TestImages.jpeg(400, 300));
    }
}
