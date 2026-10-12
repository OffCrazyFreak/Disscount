package disscount.digitalCard.service;

import disscount.digitalCard.dao.DigitalCardPhotoRepository;
import disscount.digitalCard.dao.DigitalCardRepository;
import disscount.digitalCard.dao.PhotoCleanupRepository;
import disscount.digitalCard.domain.PhotoCleanup;
import disscount.digitalCard.photo.PhotoValidator;
import disscount.digitalCard.photo.TestImages;
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

@DataJpaTest(showSql = false)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({DigitalCardService.class, DigitalCardPhotoService.class, DigitalCardMapper.class,
        StoreNameService.class, StoreNameUpsert.class, PhotoValidator.class, PhotoUploadRateLimiter.class,
        CardPhotoWriter.class, CardUserLock.class, PhotoCleanupService.class,
        PhotoCleanupServiceTest.StoreConfig.class})
class PhotoCleanupServiceTest {

    @TestConfiguration
    static class StoreConfig {
        @Bean
        FakePhotoStore photoStore() {
            return new FakePhotoStore();
        }
    }

    @Autowired DigitalCardService cardService;
    @Autowired DigitalCardPhotoService photoService;
    @Autowired PhotoCleanupService cleanup;
    @Autowired PhotoCleanupRepository queue;
    @Autowired DigitalCardRepository cards;
    @Autowired DigitalCardPhotoRepository photos;
    @Autowired UserRepository users;
    @Autowired StoreNameSuggestionRepository storeNames;
    @Autowired FakePhotoStore store;
    @Autowired PhotoUploadRateLimiter limiter;

    User owner;
    UUID cardId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        queue.deleteAll();
        photos.deleteAll();
        cards.deleteAll();
        storeNames.deleteAll();
        users.deleteAll();
        limiter.sweep();
        store.objects.clear();
        store.enabled = true;
        store.failDeletes = false;
        owner = users.save(user());
        cardService.upsert(owner.getId(), cardId, request("Kartica"));
    }

    @Test
    void successfulDeletesLeaveNothingQueued() {
        upload("front");

        photoService.delete(owner.getId(), cardId, "front");

        assertThat(store.objects).isEmpty();
        assertThat(queue.findAll()).isEmpty();
    }

    @Test
    void aFailedDeleteStaysQueuedAndTheSweepRetriesIt() {
        upload("front");
        upload("icon");
        store.failDeletes = true;

        cardService.delete(owner.getId(), cardId);

        assertThat(photos.findByCardId(cardId)).isEmpty();
        assertThat(store.objects).hasSize(3);
        assertThat(queue.findAll()).singleElement().satisfies(row -> {
            assertThat(row.isPrefix()).isTrue();
            assertThat(row.getKeyOrPrefix()).isEqualTo("cards/" + owner.getId() + "/" + cardId + "/");
        });

        cleanup.retryPending();
        assertThat(queue.findAll()).hasSize(1);

        store.failDeletes = false;
        cleanup.retryPending();

        assertThat(store.objects).isEmpty();
        assertThat(queue.findAll()).isEmpty();
    }

    @Test
    void replacingAPhotoQueuesTheOldKeysUntilTheyAreGone() {
        upload("icon");
        store.failDeletes = true;
        MockMultipartFile next = new MockMultipartFile("full", "p.webp", "image/webp", TestImages.webp(48, 48));

        photoService.upload(owner.getId(), cardId, "icon", next, null);

        assertThat(queue.findAll()).singleElement().satisfies(row -> assertThat(row.isPrefix()).isFalse());
        assertThat(store.objects).hasSize(2);

        store.failDeletes = false;
        cleanup.retryPending();

        assertThat(store.objects).hasSize(1);
        assertThat(queue.findAll()).isEmpty();
    }

    @Test
    void accountDeletionQueuesTheUserPrefixAndSurvivesAStorageOutage() {
        upload("icon");
        store.failDeletes = true;

        cardService.deleteAllForUser(owner.getId());

        assertThat(cards.findAll()).isEmpty();
        assertThat(queue.findAll()).extracting(PhotoCleanup::getKeyOrPrefix)
                .containsExactly("cards/" + owner.getId() + "/");

        store.failDeletes = false;
        cleanup.retryPending();

        assertThat(store.objects).isEmpty();
        assertThat(queue.findAll()).isEmpty();
    }

    @Test
    void rowsStayQueuedWhileStorageIsNotConfigured() {
        upload("icon");
        store.enabled = false;

        cardService.delete(owner.getId(), cardId);
        cleanup.retryPending();

        assertThat(queue.findAll()).hasSize(1);
        assertThat(store.objects).hasSize(1);

        store.enabled = true;
        cleanup.retryPending();

        assertThat(queue.findAll()).isEmpty();
        assertThat(store.objects).isEmpty();
    }

    private void upload(String slot) {
        MockMultipartFile full = new MockMultipartFile("full", "p.webp", "image/webp", TestImages.webp(32, 32));
        MockMultipartFile thumb = new MockMultipartFile("thumb", "t.webp", "image/webp", TestImages.webp(16, 16));
        photoService.upload(owner.getId(), cardId, slot, full, "icon".equals(slot) ? null : thumb);
    }
}
