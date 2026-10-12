package disscount.digitalCard.service;

import disscount.digitalCard.dao.DigitalCardPhotoRepository;
import disscount.digitalCard.dao.DigitalCardRepository;
import disscount.digitalCard.dto.CardPhotoDto;
import disscount.digitalCard.photo.PhotoValidator;
import disscount.digitalCard.photo.TestImages;
import disscount.digitalCard.storage.PhotoStore;
import disscount.exceptions.BadRequestException;
import disscount.exceptions.NotFoundException;
import disscount.exceptions.ServiceUnavailableException;
import disscount.exceptions.TooManyRequestsException;
import disscount.storeName.dao.StoreNameSuggestionRepository;
import disscount.storeName.service.StoreNameService;
import disscount.storeName.service.StoreNameUpsert;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
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
    @Autowired PhotoStore store;
    @Autowired PhotoUploadRateLimiter limiter;

    User owner;
    UUID cardId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        photos.deleteAll();
        cards.deleteAll();
        storeNames.deleteAll();
        users.deleteAll();
        limiter.sweep();
        fake().objects.clear();
        fake().enabled = true;
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
        assertThat(fake().objects.keySet()).containsExactlyInAnyOrder(prefix + ".webp", prefix + "-thumb.webp");
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

    private FakePhotoStore fake() {
        return (FakePhotoStore) store;
    }

    private static MockMultipartFile part(byte[] bytes) {
        return new MockMultipartFile("full", "p.webp", "image/webp", bytes);
    }
}
