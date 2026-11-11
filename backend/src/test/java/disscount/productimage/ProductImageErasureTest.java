package disscount.productimage;

import java.util.UUID;

import disscount.config.UploadLimitConfig;
import disscount.productimage.jobs.OffCandidateWriter;
import disscount.productimage.openfoodfacts.OpenFoodFactsClient;
import disscount.productimage.render.ProductImageRendering;
import disscount.shared.FakePhotoStore;
import disscount.shared.NotFoundException;
import disscount.shared.PhotoStoreConfig;
import disscount.shared.PhotoValidator;
import disscount.shared.ServiceUnavailableException;
import disscount.shared.TestImages;
import disscount.user.ActiveUsers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@DataJpaTest(showSql = false)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({ProductImageErasure.class, ProductImageWriteService.class, ProductImageAdminService.class,
        ProductImageViews.class, ProductImageRendering.class, ProductImageRemoval.class, OffCandidateWriter.class,
        UploadLimitConfig.class, PhotoValidator.class, ProductImageServiceTest.StoreConfig.class})
class ProductImageErasureTest {

    static final String EAN = ProductImageServiceTest.EAN;
    static final String OTHER_EAN = "5449000000996";

    @Autowired ProductImageErasure erasure;
    @Autowired ProductImageWriteService writes;
    @Autowired ProductImageAdminService admin;
    @Autowired ProductImageRepository images;
    @Autowired ProductImageSetRepository sets;
    @Autowired ProductImageReportRepository reports;
    @Autowired @Qualifier(PhotoStoreConfig.PRODUCT_ORIGINALS) FakePhotoStore originals;
    @Autowired @Qualifier(PhotoStoreConfig.PRODUCT_PHOTOS) FakePhotoStore publicStore;
    @MockitoBean ActiveUsers activeUsers;
    @MockitoBean OpenFoodFactsClient off;

    final UUID ana = UUID.randomUUID();
    final UUID marko = UUID.randomUUID();
    final UUID adminId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        reports.deleteAll();
        images.deleteAll();
        sets.deleteAll();
        originals.objects.clear();
        originals.enabled = true;
        originals.failDeletes = false;
        publicStore.objects.clear();
        publicStore.failDeletes = false;
        when(activeUsers.isActiveAdmin(adminId)).thenReturn(true);
    }

    @Test
    void anUnconfirmedPhotoGoesWithEveryFileAndTheNextPhotoBecomesMain() {
        writes.upload(marko, EAN, jpeg(500, 300));
        writes.upload(ana, EAN, jpeg(400, 300));
        ProductImage anas = images.findByContributorId(ana).get(0);
        ProductImageSet set = sets.findById(EAN).orElseThrow();
        set.setMainImageId(anas.getId());
        sets.save(set);

        erasure.eraseContributor(ana);

        assertThat(images.findById(anas.getId())).isEmpty();
        assertThat(originals.objects.keySet()).noneMatch(key -> key.equals(anas.getOriginalKey()));
        assertThat(publicStore.objects.keySet()).doesNotContain(anas.getFullKey(), anas.getThumbKey(), anas.getSmallKey());
        assertThat(sets.findById(EAN)).get().satisfies(s -> {
            assertThat(s.getMainImageId()).isEqualTo(images.findByContributorId(marko).get(0).getId());
            assertThat(s.isNeedsReview()).isTrue();
        });
    }

    @Test
    void withoutTheOriginalsFolderTheErasureFailsRatherThanLeaveTheFile() {
        writes.upload(ana, EAN, jpeg(400, 300));
        originals.enabled = false;

        assertThatThrownBy(() -> erasure.eraseContributor(ana)).isInstanceOf(ServiceUnavailableException.class);
        assertThat(images.findByContributorId(ana)).hasSize(1);
    }

    @Test
    void aFailedFileDeleteFailsTheErasure() {
        writes.upload(ana, EAN, jpeg(400, 300));
        originals.failDeletes = true;
        try {
            assertThatThrownBy(() -> erasure.eraseContributor(ana)).isInstanceOf(IllegalStateException.class);
        } finally {
            originals.failDeletes = false;
        }
        assertThat(images.findByContributorId(ana)).hasSize(1);
    }

    @Test
    void aFailedPublicFileDeleteFailsTheErasure() {
        writes.upload(ana, EAN, jpeg(400, 300));
        publicStore.failDeletes = true;
        try {
            assertThatThrownBy(() -> erasure.eraseContributor(ana)).isInstanceOf(IllegalStateException.class);
        } finally {
            publicStore.failDeletes = false;
        }
        assertThat(images.findByContributorId(ana)).hasSize(1);
    }

    @Test
    void aKeptPhotoCannotBeCroppedOnceItsOriginalIsGone() {
        writes.upload(ana, EAN, jpeg(400, 300));
        writes.upload(marko, EAN, jpeg(500, 300));
        UUID kept = images.findByContributorId(ana).get(0).getId();

        erasure.eraseContributor(ana);

        assertThatThrownBy(() -> admin.crop(adminId, kept, 90, null)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void aConfirmedPhotoStaysWithoutItsAuthorOrOriginal() {
        writes.upload(ana, EAN, jpeg(400, 300));
        writes.upload(marko, EAN, jpeg(500, 300));
        ProductImage anas = images.findByContributorId(ana).get(0);
        assertThat(anas.getStatus()).isEqualTo(ImageStatus.VERIFIED);

        erasure.eraseContributor(ana);

        assertThat(images.findById(anas.getId())).get().satisfies(row -> {
            assertThat(row.getContributorId()).isNull();
            assertThat(row.getOriginalKey()).isNull();
            assertThat(row.getFullKey()).isEqualTo(anas.getFullKey());
        });
        assertThat(originals.objects).doesNotContainKey(anas.getOriginalKey());
        assertThat(publicStore.objects).containsKey(anas.getFullKey());
    }

    @Test
    void theUsersConfirmationsAndReportsLoseTheirLink() {
        writes.upload(marko, EAN, jpeg(500, 300));
        writes.upload(ana, OTHER_EAN, jpeg(400, 300));
        writes.upload(ana, EAN, jpeg(600, 300));
        ProductImage markos = images.findByContributorId(marko).get(0);
        assertThat(markos.getConfirmedById()).isEqualTo(ana);
        writes.report(ana, markos.getId());

        erasure.eraseContributor(ana);

        assertThat(images.findById(markos.getId())).get().satisfies(row -> {
            assertThat(row.getConfirmedById()).isNull();
            assertThat(row.getReportCount()).isZero();
            assertThat(row.getFlaggedAt()).isNull();
        });
        assertThat(reports.findByUserId(ana)).isEmpty();
        assertThat(images.findByContributorId(ana)).isEmpty();
    }

    @Test
    void anAdminsTombstoneKeepsBlockingThePhotoWithoutTheAuthor() {
        writes.upload(ana, EAN, jpeg(400, 300));
        UUID id = images.findByContributorId(ana).get(0).getId();
        admin.delete(adminId, id);

        erasure.eraseContributor(ana);

        assertThat(images.findById(id)).get().satisfies(row -> {
            assertThat(row.isDeleted()).isTrue();
            assertThat(row.getContributorId()).isNull();
            assertThat(row.getContentSha256()).isNotNull();
        });
    }

    private static MockMultipartFile jpeg(int width, int height) {
        return new MockMultipartFile("photo", "p.jpg", "image/jpeg", TestImages.jpeg(width, height));
    }
}
