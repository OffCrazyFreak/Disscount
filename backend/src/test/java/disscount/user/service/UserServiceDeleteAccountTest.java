package disscount.user.service;

import disscount.digitalCard.dao.DigitalCardPhotoRepository;
import disscount.digitalCard.dao.DigitalCardRepository;
import disscount.digitalCard.dao.PhotoCleanupRepository;
import disscount.digitalCard.photo.PhotoValidator;
import disscount.digitalCard.photo.TestImages;
import disscount.digitalCard.service.CardPhotoWriter;
import disscount.digitalCard.service.CardUserLock;
import disscount.digitalCard.service.DigitalCardMapper;
import disscount.digitalCard.service.DigitalCardPhotoService;
import disscount.digitalCard.service.DigitalCardService;
import disscount.digitalCard.service.FakePhotoStore;
import disscount.digitalCard.service.PhotoCleanupService;
import disscount.digitalCard.service.PhotoUploadRateLimiter;
import disscount.digitalCard.storage.PhotoStore;
import disscount.storeName.dao.StoreNameSuggestionRepository;
import disscount.storeName.dao.StoreNameUsageRepository;
import disscount.storeName.service.StoreNameService;
import disscount.storeName.service.StoreNameUpsert;
import disscount.user.dao.AuthIdentityDao;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import disscount.favoriteStore.dao.FavoriteStoreRepository;
import disscount.favoriteStore.dto.BulkFavoriteStoreRequest;
import disscount.favoriteStore.dto.FavoriteStoreRequest;
import disscount.favoriteStore.service.FavoriteStoreService;

import static disscount.digitalCard.service.CardServiceTestSupport.request;
import static org.assertj.core.api.Assertions.assertThat;

// Not transactional on purpose: the bug only shows when the service's own transaction really commits.
@DataJpaTest(showSql = false)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({UserService.class, DigitalCardService.class, DigitalCardPhotoService.class, DigitalCardMapper.class,
        StoreNameService.class, StoreNameUpsert.class, PhotoValidator.class, PhotoUploadRateLimiter.class,
        CardPhotoWriter.class, CardUserLock.class, PhotoCleanupService.class, FavoriteStoreService.class,
        UserServiceDeleteAccountTest.StoreConfig.class})
class UserServiceDeleteAccountTest {

    @TestConfiguration
    static class StoreConfig {
        @Bean
        FakePhotoStore photoStore() {
            return new FakePhotoStore();
        }
    }

    @MockBean AuthIdentityDao authIdentityDao;
    @MockBean UserProfileCreator profileCreator;

    @Autowired UserService userService;
    @Autowired DigitalCardService cardService;
    @Autowired DigitalCardPhotoService photoService;
    @Autowired UserRepository users;
    @Autowired DigitalCardRepository cards;
    @Autowired DigitalCardPhotoRepository photos;
    @Autowired PhotoCleanupRepository cleanup;
    @Autowired StoreNameSuggestionRepository storeNames;
    @Autowired StoreNameUsageRepository storeNameUsages;
    @Autowired PhotoStore store;
    @Autowired FavoriteStoreService favoriteStoreService;
    @Autowired FavoriteStoreRepository favoriteStores;

    @BeforeEach
    void setUp() {
        cleanup.deleteAll();
        photos.deleteAll();
        cards.deleteAll();
        storeNameUsages.deleteAll();
        storeNames.deleteAll();
        favoriteStores.deleteAll();
        users.deleteAll();
        ((FakePhotoStore) store).objects.clear();
    }

    @Test
    void deleteAccountPersistsTheAnonymizationAndPurgesTheCards() {
        User user = users.save(User.builder().id(UUID.randomUUID()).username("marko").image("avatar").build());
        UUID cardId = UUID.randomUUID();
        cardService.upsert(user.getId(), cardId, request("Moja"));
        photoService.upload(user.getId(), cardId, "icon",
                new MockMultipartFile("full", "p.webp", "image/webp", TestImages.webp(32, 32)), null);
        assertThat(((FakePhotoStore) store).objects).hasSize(1);

        userService.deleteAccount(user.getId());

        User stored = users.findById(user.getId()).orElseThrow();
        assertThat(stored.getDeletedAt()).isNotNull();
        assertThat(stored.getUsername()).isNull();
        assertThat(stored.getImage()).isNull();
        assertThat(cards.findAll()).isEmpty();
        assertThat(photos.findAll()).isEmpty();
        assertThat(((FakePhotoStore) store).objects).isEmpty();
        assertThat(cleanup.findAll()).isEmpty();
    }

    @Test
    void deleteAccountRemovesStoreNameUsageAndTakesBackTheCount() {
        User leaving = users.save(User.builder().id(UUID.randomUUID()).username("ana").build());
        User staying = users.save(User.builder().id(UUID.randomUUID()).username("ivo").build());
        var custom = request("Moja");
        custom.setChainCode(null);
        custom.setStoreName("Zajednički dućan");
        cardService.upsert(leaving.getId(), UUID.randomUUID(), custom);
        cardService.upsert(staying.getId(), UUID.randomUUID(), custom);
        assertThat(storeNames.findAll()).singleElement().satisfies(s -> assertThat(s.getUseCount()).isEqualTo(2));

        userService.deleteAccount(leaving.getId());

        assertThat(storeNameUsages.findAll()).singleElement().satisfies(u -> assertThat(u.getUserId()).isEqualTo(staying.getId()));
        assertThat(storeNames.findAll()).singleElement().satisfies(s -> assertThat(s.getUseCount()).isEqualTo(1));
    }

    @Test
    void deleteAccountRemovesOnlyThatUsersFavoriteStores() {
        User leaving = users.save(User.builder().id(UUID.randomUUID()).username("ana").build());
        User staying = users.save(User.builder().id(UUID.randomUUID()).username("ivo").build());
        favoriteStoreService.updateFavoriteStores(leaving.getId(), favorites("konzum:1", "lidl:2"));
        favoriteStoreService.updateFavoriteStores(staying.getId(), favorites("konzum:1"));

        userService.deleteAccount(leaving.getId());

        assertThat(favoriteStores.findAll()).singleElement()
                .satisfies(f -> assertThat(f.getUser().getId()).isEqualTo(staying.getId()));
    }

    private static BulkFavoriteStoreRequest favorites(String... keys) {
        BulkFavoriteStoreRequest request = new BulkFavoriteStoreRequest();
        request.setStores(List.of(keys).stream().map(key -> {
            FavoriteStoreRequest store = new FavoriteStoreRequest();
            store.setStoreKey(key);
            return store;
        }).toList());
        return request;
    }
}
