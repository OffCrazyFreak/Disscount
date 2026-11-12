package disscount.productimage;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

import disscount.config.UploadLimitConfig;
import disscount.productimage.openfoodfacts.OpenFoodFactsClient;
import disscount.productimage.render.ProductImageRendering;
import disscount.shared.Timestamps;
import disscount.shared.errors.LimitReachedException;
import disscount.shared.errors.UserLimit;
import disscount.shared.photo.FakePhotoStore;
import disscount.shared.photo.PhotoValidator;
import disscount.shared.photo.TestImages;
import disscount.support.Concurrently;
import disscount.user.AccountType;
import disscount.user.ActiveUsers;
import disscount.user.AuthIdentityDao;
import disscount.user.User;
import disscount.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.jdbc.JdbcTestUtils;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Not transactional on purpose: the race needs each upload to commit on its own connection.
@DataJpaTest(showSql = false)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({ActiveUsers.class, AuthIdentityDao.class, ProductImageWriteService.class, ProductImageViews.class,
        ProductImageRendering.class, ProductImageRemoval.class, UploadLimitConfig.class, PhotoValidator.class,
        ProductPhotoLimitTest.StoreConfig.class})
class ProductPhotoLimitTest {

    static final String EAN = "8076800195057";
    static final String OTHER_EAN = "3856021300547";

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
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean OpenFoodFactsClient off;

    User ana;
    User admin;

    @BeforeEach
    void setUp() {
        JdbcTestUtils.deleteFromTables(jdbc, "app.product_image_report", "app.product_image",
                "app.product_image_set", "app.app_user");

        // A fresh id per test, because the in-memory burst limiter outlives each test.
        ana = users.save(User.builder().id(UUID.randomUUID()).username("ana").build());
        admin = users.save(User.builder().id(UUID.randomUUID()).username("admin")
                .accountType(AccountType.ADMIN).build());
    }

    @Test
    void theThirdPhotoOfAProductPassesAndTheFourthIsRefused() {
        savePhotos(ana, 2, EAN);
        writes.upload(ana.getId(), EAN, jpeg());

        assertRefused(() -> writes.upload(ana.getId(), EAN, jpeg()), UserLimit.PRODUCT_PHOTOS_PER_PRODUCT);
        writes.upload(ana.getId(), OTHER_EAN, jpeg());
        assertThat(images.countByContributorIdAndEan(ana.getId(), EAN)).isEqualTo(3);
    }

    @Test
    void aCodePaddedWithZerosIsTheSameProduct() {
        savePhotos(ana, 2, "12345678905");
        writes.upload(ana.getId(), "0012345678905", jpeg());

        assertThat(images.countByContributorIdAndEan(ana.getId(), "12345678905")).isEqualTo(3);
        assertRefused(() -> writes.upload(ana.getId(), "00012345678905", jpeg()), UserLimit.PRODUCT_PHOTOS_PER_PRODUCT);
    }

    @Test
    void theSeventyFifthPhotoOfTheDayPassesAndTheNextWaitsForTheNextUtcDay() {
        savePhotosOfDifferentProducts(ana, 74);
        writes.upload(ana.getId(), EAN, jpeg());

        assertRefused(() -> writes.upload(ana.getId(), OTHER_EAN, jpeg()), UserLimit.PRODUCT_PHOTOS_PER_DAY);

        backdateToYesterday(ana);
        writes.upload(ana.getId(), OTHER_EAN, jpeg());
    }

    @Test
    void theThreeHundredthPhotoPassesAndTheNextIsRefusedOnAnyDay() {
        savePhotosOfDifferentProducts(ana, 299);
        backdateToYesterday(ana);
        writes.upload(ana.getId(), EAN, jpeg());

        assertRefused(() -> writes.upload(ana.getId(), OTHER_EAN, jpeg()), UserLimit.PRODUCT_PHOTOS);
    }

    @Test
    void photosAnAdminRemovedStillCount() {
        savePhotos(ana, 3, EAN);
        jdbc.update("UPDATE app.product_image SET deleted_at = ? WHERE contributor_id = ?",
                Timestamps.nowUtc(), ana.getId());

        assertRefused(() -> writes.upload(ana.getId(), EAN, jpeg()), UserLimit.PRODUCT_PHOTOS_PER_PRODUCT);
    }

    @Test
    void anAdminHasNoLimit() {
        savePhotosOfDifferentProducts(admin, 300);
        savePhotos(admin, 3, EAN);

        writes.upload(admin.getId(), EAN, jpeg());

        assertThat(images.countByContributorId(admin.getId())).isEqualTo(304);
    }

    @Test
    void parallelUploadsCannotPassTheDailyLimit() throws Exception {
        savePhotosOfDifferentProducts(ana, 74);
        List<String> eans = IntStream.range(0, 6).mapToObj(i -> "385000000010" + i).toList();

        List<Throwable> failures = Concurrently.run(6, i -> writes.upload(ana.getId(), eans.get(i), jpeg()));

        assertThat(failures).hasSize(5).allSatisfy(failure -> assertThat(failure)
                .isInstanceOfSatisfying(LimitReachedException.class,
                        e -> assertThat(e.getLimit()).isEqualTo(UserLimit.PRODUCT_PHOTOS_PER_DAY)));
        assertThat(images.countByContributorId(ana.getId())).isEqualTo(75);
    }

    private void savePhotos(User contributor, int count, String ean) {
        images.saveAll(IntStream.range(0, count).mapToObj(i -> photo(contributor, ean)).toList());
    }

    private void savePhotosOfDifferentProducts(User contributor, int count) {
        images.saveAll(IntStream.range(0, count).mapToObj(i -> photo(contributor, "38590000%05d".formatted(i))).toList());
    }

    private static ProductImage photo(User contributor, String ean) {
        return ProductImage.builder()
                .ean(ean)
                .source(ImageSource.USER)
                .status(ImageStatus.PENDING)
                .contributorId(contributor.getId())
                .build();
    }

    private void backdateToYesterday(User contributor) {
        LocalDateTime yesterday = Timestamps.nowUtc().minusDays(1);
        jdbc.update("UPDATE app.product_image SET created_at = ? WHERE contributor_id = ?", yesterday, contributor.getId());
    }

    private static void assertRefused(Runnable upload, UserLimit limit) {
        assertThatThrownBy(upload::run)
                .isInstanceOfSatisfying(LimitReachedException.class, e -> assertThat(e.getLimit()).isEqualTo(limit));
    }

    private static MockMultipartFile jpeg() {
        return new MockMultipartFile("photo", "p.jpg", "image/jpeg", TestImages.jpeg(400, 300));
    }
}
