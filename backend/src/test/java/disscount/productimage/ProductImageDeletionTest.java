package disscount.productimage;

import java.util.UUID;

import disscount.config.UploadLimitConfig;
import disscount.productimage.ProductImageDtos.ContributorPhotoCountDto;
import disscount.productimage.jobs.OffCandidateWriter;
import disscount.productimage.openfoodfacts.OpenFoodFactsClient;
import disscount.productimage.render.ProductImageRenderer;
import disscount.productimage.render.ProductImageRendering;
import disscount.shared.errors.BadRequestException;
import disscount.shared.photo.FakePhotoStore;
import disscount.shared.errors.NotFoundException;
import disscount.shared.photo.PhotoStoreConfig;
import disscount.shared.photo.PhotoValidator;
import disscount.shared.errors.ServiceUnavailableException;
import disscount.shared.photo.TestImages;
import disscount.user.ActiveUsers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@DataJpaTest(showSql = false)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({ProductImageQueryService.class, ProductImageWriteService.class, ProductImageAdminService.class,
        ProductImageViews.class, ProductImageRendering.class, ProductImageRemoval.class, OffCandidateWriter.class,
        UploadLimitConfig.class, PhotoValidator.class, ProductImageServiceTest.StoreConfig.class})
class ProductImageDeletionTest {

    static final String EAN = ProductImageServiceTest.EAN;

    @Autowired ProductImageWriteService writes;
    @Autowired ProductImageAdminService admin;
    @Autowired ProductImageRepository images;
    @Autowired ProductImageSetRepository sets;
    @Autowired ProductImageReportRepository reports;
    @Autowired OffCandidateWriter candidates;
    @Autowired PlatformTransactionManager transactions;
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
        publicStore.objects.clear();
        when(activeUsers.isActiveAdmin(adminId)).thenReturn(true);
    }

    @Test
    void deletingRemovesEveryFileAndKeepsOnlyATombstone() {
        writes.upload(ana, EAN, jpeg(400, 300));
        ProductImage photo = images.findByEanOrderByCreatedAtAsc(EAN).get(0);
        writes.report(marko, photo.getId());
        String cleanedHash = ProductImageRenderer.sha256(originals.objects.values().iterator().next());

        assertThat(admin.delete(adminId, photo.getId()).images()).isEmpty();

        assertThat(originals.objects).isEmpty();
        assertThat(publicStore.objects).isEmpty();
        assertThat(reports.count()).isZero();
        assertThat(images.findById(photo.getId())).get().satisfies(row -> {
            assertThat(row.isDeleted()).isTrue();
            assertThat(row.getDeletedById()).isEqualTo(adminId);
            assertThat(row.getStatus()).isEqualTo(ImageStatus.HIDDEN);
            assertThat(row.getContentSha256()).isEqualTo(cleanedHash);
            assertThat(row.getOriginalKey()).isNull();
            assertThat(row.getFullKey()).isNull();
        });
        assertThat(sets.findById(EAN)).get().satisfies(set -> {
            assertThat(set.getMainImageId()).isNull();
            // The shown photo is gone, so the product goes back to the review queue.
            assertThat(set.isNeedsReview()).isTrue();
        });
    }

    @Test
    void aRolledBackDeletionKeepsEveryFile() {
        writes.upload(ana, EAN, jpeg(400, 300));
        ProductImage photo = images.findByEanOrderByCreatedAtAsc(EAN).get(0);

        new TransactionTemplate(transactions).executeWithoutResult(status -> {
            admin.delete(adminId, photo.getId());
            status.setRollbackOnly();
        });

        assertThat(images.findById(photo.getId())).get().extracting(ProductImage::isDeleted).isEqualTo(false);
        assertThat(originals.objects).containsKey(photo.getOriginalKey());
        assertThat(publicStore.objects).containsKeys(photo.getFullKey(), photo.getSmallKey());
    }

    @Test
    void withoutTheOriginalsFolderAnUploadCannotBeDeleted() {
        writes.upload(ana, EAN, jpeg(400, 300));
        ProductImage photo = images.findByEanOrderByCreatedAtAsc(EAN).get(0);
        originals.enabled = false;

        assertThatThrownBy(() -> admin.delete(adminId, photo.getId()))
                .isInstanceOf(ServiceUnavailableException.class);
        assertThat(images.findById(photo.getId())).get().extracting(ProductImage::isDeleted).isEqualTo(false);
    }

    @Test
    void theSameFileCannotBeUploadedAgainByAnyone() {
        writes.upload(ana, EAN, jpeg(400, 300));
        admin.delete(adminId, images.findByEanOrderByCreatedAtAsc(EAN).get(0).getId());

        assertThatThrownBy(() -> writes.upload(marko, EAN, jpeg(400, 300)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("error.productImage.deleted");
        writes.upload(marko, EAN, jpeg(500, 300));
        assertThat(originals.objects).hasSize(1);
    }

    @Test
    void aPhotoUploadedBeforeFingerprintsIsFingerprintedFromItsOriginal() {
        writes.upload(ana, EAN, jpeg(400, 300));
        ProductImage photo = images.findByEanOrderByCreatedAtAsc(EAN).get(0);
        photo.setContentSha256(null);
        images.save(photo);

        admin.delete(adminId, photo.getId());

        assertThat(images.findById(photo.getId())).get().extracting(ProductImage::getContentSha256).isNotNull();
        assertThatThrownBy(() -> writes.upload(marko, EAN, jpeg(400, 300)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("error.productImage.deleted");
    }

    @Test
    void aDeletedOpenFoodFactsPhotoStaysDeletedWhenTheImportSeesANewRevision() {
        ProductImage candidate = images.save(ProductImage.builder().ean(EAN).source(ImageSource.OPEN_FOOD_FACTS)
                .status(ImageStatus.CANDIDATE).externalKey("front_hr").externalRev("3570").lang("hr").build());

        admin.delete(adminId, candidate.getId());
        candidates.upsert(EAN, "front_hr", "3571", "hr");

        assertThat(images.findByEanOrderByCreatedAtAsc(EAN)).singleElement().satisfies(row -> {
            assertThat(row.isDeleted()).isTrue();
            assertThat(row.getStatus()).isEqualTo(ImageStatus.HIDDEN);
            assertThat(row.getHiddenReason()).isEqualTo(HiddenReason.ADMIN);
            assertThat(row.getExternalRev()).isEqualTo("3570");
        });
    }

    @Test
    void aDeletedPhotoCannotBeRestoredCroppedOrMadeMain() {
        writes.upload(ana, EAN, jpeg(400, 300));
        UUID id = images.findByEanOrderByCreatedAtAsc(EAN).get(0).getId();
        admin.delete(adminId, id);

        assertThatThrownBy(() -> admin.setStatus(adminId, id, "VERIFIED")).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> admin.crop(adminId, id, 90, null)).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> admin.setMain(adminId, EAN, id)).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> admin.delete(adminId, id)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void contributorCountsShowUploadsAndDeletionsPerUser() {
        writes.upload(ana, EAN, jpeg(400, 300));
        writes.upload(ana, EAN, jpeg(500, 300));
        writes.upload(marko, EAN, jpeg(600, 300));
        admin.delete(adminId, images.findByEanOrderByCreatedAtAsc(EAN).get(0).getId());

        assertThat(admin.contributorCounts()).containsExactlyInAnyOrder(
                new ContributorPhotoCountDto(ana, 2, 1),
                new ContributorPhotoCountDto(marko, 1, 0));
    }

    private static MockMultipartFile jpeg(int width, int height) {
        return new MockMultipartFile("photo", "p.jpg", "image/jpeg", TestImages.jpeg(width, height));
    }
}
