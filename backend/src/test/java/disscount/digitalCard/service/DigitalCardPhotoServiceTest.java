package disscount.digitalCard.service;

import disscount.digitalCard.dao.DigitalCardPhotoRepository;
import disscount.digitalCard.dao.DigitalCardRepository;
import disscount.digitalCard.dao.PhotoCleanupRepository;
import disscount.digitalCard.dto.CardPhotoDto;
import disscount.digitalCard.photo.PhotoValidator;
import disscount.digitalCard.photo.TestImages;
import disscount.digitalCard.storage.PhotoStore;
import disscount.exceptions.BadRequestException;
import disscount.exceptions.NotFoundException;
import disscount.exceptions.ServiceUnavailableException;
import disscount.exceptions.TooManyRequestsException;
import disscount.storeName.dao.StoreNameSuggestionRepository;
import disscount.storeName.dao.StoreNameUsageRepository;
import disscount.storeName.service.StoreNameService;
import disscount.storeName.service.StoreNameUpsert;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static disscount.digitalCard.service.CardServiceTestSupport.request;
import static disscount.digitalCard.service.CardServiceTestSupport.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest(showSql = false)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({DigitalCardService.class, DigitalCardPhotoService.class, DigitalCardMapper.class,
        StoreNameService.class, StoreNameUpsert.class, PhotoValidator.class, PhotoUploadRateLimiter.class,
        CardPhotoWriter.class, CardUserLock.class, PhotoCleanupService.class,
        DigitalCardPhotoServiceTest.StoreConfig.class})
class DigitalCardPhotoServiceTest {

    @TestConfiguration
    static class StoreConfig {
        @Bean
        FakePhotoStore photoStore() {
            return new FakePhotoStore();
        }
    }

    @Autowired DigitalCardService cardService;
    @Autowired DigitalCardPhotoService photoService;
    @Autowired DigitalCardRepository cards;
    @Autowired DigitalCardPhotoRepository photos;
    @Autowired UserRepository users;
    @Autowired StoreNameSuggestionRepository storeNames;
    @Autowired StoreNameUsageRepository storeNameUsages;
    @Autowired PhotoStore store;
    @Autowired PhotoCleanupRepository cleanupRows;
    @Autowired PhotoUploadRateLimiter limiter;
    @SpyBean CardPhotoWriter writer;

    User owner;
    UUID cardId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        cleanupRows.deleteAll();
        photos.deleteAll();
        cards.deleteAll();
        storeNameUsages.deleteAll();
        storeNames.deleteAll();
        users.deleteAll();
        limiter.sweep();
        fake().objects.clear();
        fake().enabled = true;
        fake().failDeletes = false;
        owner = users.save(user());
        cardService.upsert(owner.getId(), cardId, request("Kartica"));
    }

    @Test
    void uploadStoresFullAndThumbUnderContentAddressedKeys() {
        CardPhotoDto dto = photoService.upload(owner.getId(), cardId, "front",
                part(TestImages.webp(64, 48)), part(TestImages.webp(16, 12)));

        String prefix = "cards/" + owner.getId() + "/" + cardId + "/front-" + dto.getSha256();
        assertThat(dto.getSlot()).isEqualTo("front");
        assertThat(dto.getSha256()).hasSize(64);
        assertThat(fake().objects.keySet()).hasSize(2)
                .anyMatch(k -> k.matches(java.util.regex.Pattern.quote(prefix) + "-[0-9a-f]{12}\\.webp"))
                .anyMatch(k -> k.matches(java.util.regex.Pattern.quote(prefix) + "-[0-9a-f]{12}-thumb\\.webp"));
    }

    @Test
    void replacingASlotDeletesTheOldObjectsAfterCommit() {
        CardPhotoDto first = photoService.upload(owner.getId(), cardId, "back",
                part(TestImages.webp(64, 48)), part(TestImages.webp(16, 12)));
        CardPhotoDto second = photoService.upload(owner.getId(), cardId, "back",
                part(TestImages.webp(80, 60)), part(TestImages.webp(20, 15)));

        assertThat(second.getSha256()).isNotEqualTo(first.getSha256());
        assertThat(photos.findByCardId(cardId)).hasSize(1);
        assertThat(fake().objects.keySet()).hasSize(2).allMatch(k -> k.contains(second.getSha256()));
    }

    @Test
    void deleteRemovesRowAndObjects() {
        photoService.upload(owner.getId(), cardId, "front", part(TestImages.webp(64, 48)), part(TestImages.webp(16, 12)));

        photoService.delete(owner.getId(), cardId, "front");

        assertThat(photos.findByCardId(cardId)).isEmpty();
        assertThat(fake().objects).isEmpty();
        assertThatThrownBy(() -> photoService.delete(owner.getId(), cardId, "front"))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void openRejectsAStaleVersionAndForeignUsers() {
        CardPhotoDto dto = photoService.upload(owner.getId(), cardId, "icon", part(TestImages.webp(32, 32)), null);

        assertThat(photoService.open(owner.getId(), cardId, "icon", false, dto.getSha256()).sha256())
                .isEqualTo(dto.getSha256());
        assertThatThrownBy(() -> photoService.open(owner.getId(), cardId, "icon", false, "0".repeat(64)))
                .isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> photoService.open(owner.getId(), cardId, "icon", true, null))
                .isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> photoService.open(UUID.randomUUID(), cardId, "icon", false, null))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void slotRulesAreEnforced() {
        MockMultipartFile img = part(TestImages.webp(64, 48));
        MockMultipartFile thumb = part(TestImages.webp(16, 12));

        assertThatThrownBy(() -> photoService.upload(owner.getId(), cardId, "side", img, thumb))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> photoService.upload(owner.getId(), cardId, "front", img, null))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> photoService.upload(owner.getId(), cardId, "icon", img, thumb))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> photoService.upload(owner.getId(), cardId, "front",
                part(TestImages.png(8, 8)), thumb)).isInstanceOf(BadRequestException.class);
        assertThat(fake().objects).isEmpty();
    }

    @Test
    void uploadOnAnotherUsersCardIsNotFound() {
        assertThatThrownBy(() -> photoService.upload(UUID.randomUUID(), cardId, "icon",
                part(TestImages.webp(32, 32)), null)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void uploadAnswers503WhenStorageIsNotConfigured() {
        fake().enabled = false;

        assertThatThrownBy(() -> photoService.upload(owner.getId(), cardId, "icon",
                part(TestImages.webp(32, 32)), null)).isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    void twentyFirstUploadInAMinuteIsRateLimited() {
        for (int i = 0; i < 20; i++) {
            photoService.upload(owner.getId(), cardId, "icon", part(TestImages.webp(32 + i, 32)), null);
        }

        assertThatThrownBy(() -> photoService.upload(owner.getId(), cardId, "icon",
                part(TestImages.webp(99, 32)), null))
                .isInstanceOfSatisfying(TooManyRequestsException.class,
                        e -> assertThat(e.getRetryAfterSeconds()).isBetween(1L, 60L));
    }

    @Test
    void replacingOnlyTheThumbnailChangesTheVersionAndKeys() {
        byte[] full = TestImages.webp(64, 48);
        CardPhotoDto first = photoService.upload(owner.getId(), cardId, "front", part(full), part(TestImages.webp(16, 12)));
        CardPhotoDto second = photoService.upload(owner.getId(), cardId, "front", part(full), part(TestImages.webp(20, 15)));

        assertThat(second.getSha256()).isNotEqualTo(first.getSha256());
        assertThat(fake().objects.keySet()).hasSize(2).allMatch(k -> k.contains(second.getSha256()));
        assertThat(photos.findByCardId(cardId)).singleElement()
                .satisfies(p -> assertThat(p.getSha256()).isEqualTo(second.getSha256()));
    }

    @Test
    void concurrentUploadsToOneSlotLeaveOneRowAndOnlyItsObjects() throws Exception {
        java.util.concurrent.ExecutorService pool = java.util.concurrent.Executors.newFixedThreadPool(5);
        java.util.concurrent.CountDownLatch start = new java.util.concurrent.CountDownLatch(1);
        java.util.List<java.util.concurrent.Future<CardPhotoDto>> futures = new java.util.ArrayList<>();
        for (int i = 0; i < 5; i++) {
            int size = 20 + i;
            futures.add(pool.submit(() -> {
                start.await();
                return photoService.upload(owner.getId(), cardId, "back",
                        part(TestImages.webp(size * 4, size * 3)), part(TestImages.webp(size, size)));
            }));
        }
        start.countDown();
        for (java.util.concurrent.Future<CardPhotoDto> future : futures) future.get(30, java.util.concurrent.TimeUnit.SECONDS);
        pool.shutdown();

        assertThat(photos.findByCardId(cardId)).hasSize(1).first().satisfies(row ->
                assertThat(fake().objects.keySet()).containsExactlyInAnyOrder(row.getFullKey(), row.getThumbKey()));
    }

    @Test
    void aPhotoWriteAfterTheCardWasDeletedIsRefusedAndStoresNothing() {
        cardService.delete(owner.getId(), cardId);

        assertThatThrownBy(() -> writer.replace(owner.getId(), cardId, "icon",
                new CardPhotoWriter.Stored("a".repeat(64), "cards/k.webp", null, "image/webp", 10)))
                .isInstanceOf(NotFoundException.class);
        assertThat(photos.findByCardId(cardId)).isEmpty();
    }

    @Test
    void aFailedRowWriteRemovesTheObjectsJustStoredButKeepsLiveOnes() {
        byte[] bytes = TestImages.webp(32, 32);
        CardPhotoDto live = photoService.upload(owner.getId(), cardId, "icon", part(bytes), null);
        org.mockito.Mockito.doThrow(new IllegalStateException("db down")).when(writer)
                .replace(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
                        org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());

        assertThatThrownBy(() -> photoService.upload(owner.getId(), cardId, "icon", part(bytes), null))
                .isInstanceOf(IllegalStateException.class);
        assertThat(fake().objects.keySet()).singleElement().satisfies(k -> assertThat(k).contains(live.getSha256()));

        assertThatThrownBy(() -> photoService.upload(owner.getId(), cardId, "icon", part(TestImages.webp(40, 40)), null))
                .isInstanceOf(IllegalStateException.class);
        assertThat(fake().objects.keySet()).singleElement().satisfies(k -> assertThat(k).contains(live.getSha256()));
    }

    private FakePhotoStore fake() {
        return (FakePhotoStore) store;
    }

    private static MockMultipartFile part(byte[] bytes) {
        return new MockMultipartFile("full", "p.webp", "image/webp", bytes);
    }
}
