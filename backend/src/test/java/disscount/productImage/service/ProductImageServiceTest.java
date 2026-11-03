package disscount.productImage.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import disscount.digitalCard.photo.PhotoValidator;
import disscount.digitalCard.photo.TestImages;
import disscount.digitalCard.service.FakePhotoStore;
import disscount.exceptions.BadRequestException;
import disscount.productImage.FakeProductImageStore;
import disscount.productImage.dao.ProductImageReportRepository;
import disscount.productImage.dao.ProductImageRepository;
import disscount.productImage.dao.ProductImageSetRepository;
import disscount.productImage.domain.ImageSource;
import disscount.productImage.domain.ImageStatus;
import disscount.productImage.domain.ProductImage;
import disscount.productImage.domain.ProductImageSet;
import disscount.productImage.dto.ProductImageDtos.AdminProductDto;
import disscount.productImage.dto.ProductImageDtos.AdminQueuePageDto;
import disscount.productImage.dto.ProductImageDtos.CropDto;
import disscount.productImage.dto.ProductImageDtos.ProductImagesDto;
import disscount.productImage.off.OffProductPhotos;
import disscount.productImage.off.OpenFoodFactsClient;
import disscount.user.service.UserService;
import disscount.util.Timestamps;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@DataJpaTest(showSql = false)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({ProductImageQueryService.class, ProductImageWriteService.class, ProductImageAdminService.class,
        ProductImageViews.class, ProductImageRendering.class, OffCandidateWriter.class, ProductPhotoUploadLimiter.class,
        PhotoValidator.class, ProductImageServiceTest.StoreConfig.class})
class ProductImageServiceTest {

    static final String EAN = "8076800195057";

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

    @Autowired ProductImageQueryService queries;
    @Autowired ProductImageWriteService writes;
    @Autowired ProductImageAdminService admin;
    @Autowired ProductImageRepository images;
    @Autowired ProductImageSetRepository sets;
    @Autowired ProductImageReportRepository reports;
    @Autowired FakePhotoStore originals;
    @Autowired FakeProductImageStore publicStore;
    @Autowired OffCandidateWriter candidates;
    @Autowired PlatformTransactionManager transactions;
    @MockBean UserService userService;
    @MockBean OpenFoodFactsClient off;

    final UUID ana = UUID.randomUUID();
    final UUID marko = UUID.randomUUID();
    final UUID adminId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        reports.deleteAll();
        images.deleteAll();
        sets.deleteAll();
        originals.objects.clear();
        publicStore.objects.clear();
        when(userService.isActiveAdmin(adminId)).thenReturn(true);
    }

    @Test
    void userPhotoIsUnconfirmedButShownWhileItIsTheMainPhoto() {
        ProductImagesDto shown = writes.upload(ana, EAN, jpeg());

        ProductImage stored = images.findByEanOrderByCreatedAtAsc(EAN).get(0);
        assertThat(stored.getStatus()).isEqualTo(ImageStatus.PENDING);
        assertThat(stored.getSource()).isEqualTo(ImageSource.USER);
        assertThat(shown.images()).singleElement().satisfies(i -> {
            assertThat(i.status()).isEqualTo("PENDING");
            assertThat(i.thumbUrl()).startsWith("https://images.test/products/" + EAN + "/");
        });
        assertThat(sets.findById(EAN)).get().satisfies(s -> {
            assertThat(s.getMainImageId()).isEqualTo(stored.getId());
            assertThat(s.isNeedsReview()).isTrue();
        });
        assertThat(originals.objects.keySet()).singleElement().asString().startsWith("product-originals/" + EAN + "/");
        assertThat(publicStore.objects).hasSize(2);
    }

    @Test
    void aSecondUsersPhotoConfirmsTheFirstAndWaitsForItsOwnConfirmation() {
        writes.upload(ana, EAN, jpeg());
        ProductImagesDto shown = writes.upload(marko, EAN, jpeg());

        List<ProductImage> all = images.findByEanOrderByCreatedAtAsc(EAN);
        assertThat(all.get(0).getStatus()).isEqualTo(ImageStatus.VERIFIED);
        assertThat(all.get(0).getConfirmedById()).isEqualTo(marko);
        assertThat(all.get(1).getStatus()).isEqualTo(ImageStatus.PENDING);
        // Marko's photo is unconfirmed and not the main one, so users do not see it yet.
        assertThat(shown.images()).extracting(i -> i.id()).containsExactly(all.get(0).getId());
    }

    @Test
    void theSameUserCannotConfirmTheirOwnPhoto() {
        writes.upload(ana, EAN, jpeg());
        writes.upload(ana, EAN, jpeg());

        assertThat(images.findByEanOrderByCreatedAtAsc(EAN)).allMatch(i -> i.getStatus() == ImageStatus.PENDING);
    }

    @Test
    void anUnconfirmedUploadDoesNotTakeMainFromAnOpenFoodFactsFrontWaitingToBeCopied() {
        ProductImage front = candidate("front_hr", "4", "hr");

        writes.upload(ana, EAN, jpeg());

        assertThat(sets.findById(EAN)).get().extracting(ProductImageSet::getMainImageId).isEqualTo(front.getId());
    }

    @Test
    void adminPhotoIsVerifiedPinnedAndShownFirst() {
        writes.upload(ana, EAN, jpeg());
        ProductImagesDto shown = writes.upload(adminId, EAN, jpeg());

        ProductImageSet set = sets.findById(EAN).orElseThrow();
        assertThat(set.isPinned()).isTrue();
        assertThat(set.getReviewedAt()).isNotNull();
        assertThat(shown.images().get(0).source()).isEqualTo("ADMIN");
        assertThat(shown.images().get(0).status()).isEqualTo("VERIFIED");
    }

    @Test
    void onlyJpegIsAccepted() {
        MockMultipartFile webp = new MockMultipartFile("photo", "p.webp", "image/webp", TestImages.webp(64, 48));

        assertThatThrownBy(() -> writes.upload(ana, EAN, webp))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("error.productImage.jpegOnly");
        assertThat(images.count()).isZero();
    }

    @Test
    void reportsCountOncePerUserAndFlagTheProduct() {
        writes.upload(ana, EAN, jpeg());
        UUID imageId = images.findByEanOrderByCreatedAtAsc(EAN).get(0).getId();
        sets.findById(EAN).ifPresent(s -> {
            s.setNeedsReview(false);
            sets.save(s);
        });

        writes.report(marko, imageId);
        writes.report(marko, imageId);

        assertThat(images.findById(imageId)).get().satisfies(i -> {
            assertThat(i.getReportCount()).isEqualTo(1);
            assertThat(i.getFlaggedAt()).isNotNull();
        });
        assertThat(sets.findById(EAN).orElseThrow().isNeedsReview()).isTrue();

        admin.setStatus(adminId, imageId, "VERIFIED");
        assertThat(images.findById(imageId).orElseThrow().getReportCount()).isZero();
        assertThat(reports.count()).isZero();
    }

    @Test
    void choosingAnOpenFoodFactsCandidateCopiesItAndPinsIt() {
        ProductImage candidate = candidate("front_hr", "3570", "hr");
        when(off.download(anyString())).thenReturn(TestImages.jpeg(300, 200));

        AdminProductDto product = admin.setMain(adminId, EAN, candidate.getId());

        ProductImage copied = images.findById(candidate.getId()).orElseThrow();
        assertThat(copied.getStatus()).isEqualTo(ImageStatus.VERIFIED);
        assertThat(copied.isRendered()).isTrue();
        assertThat(product.pinned()).isTrue();
        assertThat(product.mainImageId()).isEqualTo(candidate.getId());
        assertThat(queries.forProduct(EAN).images()).singleElement()
                .satisfies(i -> assertThat(i.source()).isEqualTo("OPEN_FOOD_FACTS"));
    }

    @Test
    void refreshAddsEveryOpenFoodFactsPhotoAndPrefersTheCroatianFront() {
        candidate("front_en", "3881", "en");
        when(off.fetchPhotos(EAN)).thenReturn(Optional.of(new OffProductPhotos(
                List.of(new OffProductPhotos.Photo("front_hr", "3570", "hr", "44"),
                        new OffProductPhotos.Photo("front_en", "3900", "en", "117")),
                List.of(new OffProductPhotos.Photo("raw:2", null, null, "2")))));

        AdminProductDto product = admin.refreshFromOpenFoodFacts(EAN);

        assertThat(product.images()).hasSize(3);
        ProductImage hr = images.findByEanAndSourceAndExternalKey(EAN, ImageSource.OPEN_FOOD_FACTS, "front_hr").orElseThrow();
        assertThat(product.mainImageId()).isEqualTo(hr.getId());
        assertThat(images.findByEanAndSourceAndExternalKey(EAN, ImageSource.OPEN_FOOD_FACTS, "front_en"))
                .get().extracting(ProductImage::getExternalRev).isEqualTo("3900");
        assertThat(product.offDetailsFetchedAt()).isNotNull();
        // Nothing is copied yet, so users still see no photo.
        assertThat(queries.forProduct(EAN).images()).isEmpty();
    }

    @Test
    void hidingTheMainPhotoHandsTheChoiceBackToTheAutomaticPick() {
        writes.upload(ana, EAN, jpeg());
        writes.upload(marko, EAN, jpeg());
        UUID markos = images.findByEanOrderByCreatedAtAsc(EAN).get(1).getId();
        UUID anas = images.findByEanOrderByCreatedAtAsc(EAN).get(0).getId();
        admin.setMain(adminId, EAN, markos);

        AdminProductDto product = admin.setStatus(adminId, markos, "HIDDEN");

        assertThat(product.pinned()).isFalse();
        assertThat(product.mainImageId()).isEqualTo(anas);
        assertThat(queries.forProduct(EAN).images()).extracting(i -> i.id()).containsExactly(anas);
    }

    @Test
    void cropRendersAgainFromTheOriginalAndRejectsAreasOutsideIt() {
        writes.upload(ana, EAN, jpeg());
        ProductImage photo = images.findByEanOrderByCreatedAtAsc(EAN).get(0);
        String before = photo.getFullKey();

        admin.crop(adminId, photo.getId(), 0, new CropDto(10, 10, 100, 80));

        ProductImage cropped = images.findById(photo.getId()).orElseThrow();
        assertThat(cropped.getFullKey()).isNotEqualTo(before);
        assertThat(cropped.getStatus()).isEqualTo(ImageStatus.VERIFIED);
        assertThat(publicStore.objects).doesNotContainKey(before).hasSize(2);
        assertThatThrownBy(() -> admin.crop(adminId, photo.getId(), 0, new CropDto(0, 0, 5000, 80)))
                .hasMessage("error.productImage.crop");
    }

    @Test
    void queueListsUnreviewedProductsMostWidelySoldFirst() {
        sets.save(ProductImageSet.builder().ean("3856021300547").storeListings(40).build());
        sets.save(ProductImageSet.builder().ean("5449000000996").storeListings(900).build());
        sets.save(ProductImageSet.builder().ean(EAN).storeListings(500).build());
        admin.reviewed(adminId, EAN);

        AdminQueuePageDto page = admin.queue("todo", 0, 10);

        assertThat(page.items()).extracting(i -> i.ean()).containsExactly("5449000000996", "3856021300547");
        assertThat(page.reviewedCount()).isEqualTo(1);
        assertThatThrownBy(() -> admin.queue("nope", 0, 10)).hasMessage("error.productImage.invalidFilter");
    }

    @Test
    void thumbnailsListOnlyProductsWithAShownMainPhoto() {
        writes.upload(ana, EAN, jpeg());
        candidate("front_en", "1129", "en");

        assertThat(queries.thumbnails(List.of(EAN, "5449000000996")).thumbnails()).containsOnlyKeys(EAN);
    }

    @Test
    void aMalformedEanIsLeftOutOfThumbnailsInsteadOfFailingTheBatch() {
        writes.upload(ana, EAN, jpeg());

        assertThat(queries.thumbnails(List.of("abc", EAN)).thumbnails()).containsOnlyKeys(EAN);
    }

    @Test
    void aHiddenUncopiedFrontComesBackWhenOpenFoodFactsHasANewVersion() {
        ProductImage front = candidate("front_hr", "4", "hr");
        front.setStatus(ImageStatus.HIDDEN);
        front.setRenderRetryAt(Timestamps.nowUtc().plusHours(1));
        images.save(front);

        candidates.upsert(EAN, "front_hr", "4", "hr");
        assertThat(images.findById(front.getId())).get().extracting(ProductImage::getStatus).isEqualTo(ImageStatus.HIDDEN);

        candidates.upsert(EAN, "front_hr", "5", "hr");
        assertThat(images.findById(front.getId())).get().satisfies(i -> {
            assertThat(i.getStatus()).isEqualTo(ImageStatus.CANDIDATE);
            assertThat(i.getExternalRev()).isEqualTo("5");
            assertThat(i.getRenderRetryAt()).isNull();
        });
    }

    @Test
    void aHiddenCopiedPhotoStaysHiddenWhenOpenFoodFactsHasANewVersion() {
        ProductImage front = candidate("front_hr", "4", "hr");
        when(off.download(anyString())).thenReturn(TestImages.jpeg(300, 200));
        admin.setMain(adminId, EAN, front.getId());
        admin.setStatus(adminId, front.getId(), "HIDDEN");

        candidates.upsert(EAN, "front_hr", "5", "hr");

        assertThat(images.findById(front.getId())).get().satisfies(i -> {
            assertThat(i.getStatus()).isEqualTo(ImageStatus.HIDDEN);
            assertThat(i.getExternalRev()).isEqualTo("4");
        });
    }

    @Test
    void aRolledBackCropKeepsTheFilesTheStoredRowStillPointsAt() {
        writes.upload(ana, EAN, jpeg());
        ProductImage photo = images.findByEanOrderByCreatedAtAsc(EAN).get(0);

        new TransactionTemplate(transactions).executeWithoutResult(status -> {
            admin.crop(adminId, photo.getId(), 0, new CropDto(10, 10, 100, 80));
            status.setRollbackOnly();
        });

        assertThat(images.findById(photo.getId())).get().extracting(ProductImage::getFullKey).isEqualTo(photo.getFullKey());
        assertThat(publicStore.objects).containsKeys(photo.getFullKey(), photo.getThumbKey());
    }

    @Test
    void listedEansSkipProductsNoStorePricesAnyMore() {
        sets.save(ProductImageSet.builder().ean("5449000000996").chainCount(1).storeListings(1).build());
        sets.save(ProductImageSet.builder().ean(EAN).chainCount(3).storeListings(40).build());
        // Listed in a chain's products.csv but priced in no store.
        sets.save(ProductImageSet.builder().ean("3856021300547").chainCount(1).storeListings(0).build());

        assertThat(queries.listedEans().eans()).containsExactly("5449000000996", EAN);
    }

    private ProductImage candidate(String key, String rev, String lang) {
        String ean = "front_en".equals(key) && "1129".equals(rev) ? "5449000000996" : EAN;
        ProductImage image = images.save(ProductImage.builder().ean(ean).source(ImageSource.OPEN_FOOD_FACTS)
                .status(ImageStatus.CANDIDATE).externalKey(key).externalRev(rev).lang(lang).build());
        ProductImageSet set = sets.findById(ean).orElseGet(() -> ProductImageSet.builder().ean(ean).build());
        set.setMainImageId(image.getId());
        sets.save(set);
        return image;
    }

    private static MockMultipartFile jpeg() {
        return new MockMultipartFile("photo", "p.jpg", "image/jpeg", TestImages.jpeg(400, 300));
    }
}
