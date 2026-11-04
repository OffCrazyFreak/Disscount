package disscount.user.service;

import disscount.config.UploadLimitConfig;
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
import disscount.digitalCard.storage.PhotoStore;
import disscount.storeName.dao.StoreNameSuggestionRepository;
import disscount.storeName.dao.StoreNameUsageRepository;
import disscount.storeName.service.StoreNameService;
import disscount.storeName.service.StoreNameUpsert;
import disscount.exceptions.BadRequestException;
import disscount.user.avatar.AvatarSanitizer;
import disscount.user.dao.AuthIdentityDao;
import disscount.user.dao.ErasureLedgerRepository;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import disscount.util.Timestamps;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import disscount.favoriteStore.dao.FavoriteStoreRepository;
import disscount.favoriteStore.dto.BulkFavoriteStoreRequest;
import disscount.favoriteStore.dto.FavoriteStoreRequest;
import disscount.favoriteStore.service.FavoriteStoreService;

import static disscount.digitalCard.service.CardServiceTestSupport.request;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

// Not transactional on purpose: the bug only shows when the service's own transaction really commits.
@DataJpaTest(showSql = false)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({UserService.class, AccountErasureService.class, DigitalCardService.class, DigitalCardPhotoService.class, DigitalCardMapper.class,
        StoreNameService.class, StoreNameUpsert.class, PhotoValidator.class, UploadLimitConfig.class,
        CardPhotoWriter.class, CardUserLock.class, PhotoCleanupService.class, FavoriteStoreService.class,
        AvatarSanitizer.class, UserServiceDeleteAccountTest.StoreConfig.class})
class UserServiceDeleteAccountTest {

    @TestConfiguration
    static class StoreConfig {
        @Bean
        FakePhotoStore photoStore() {
            return new FakePhotoStore();
        }
    }

    @MockitoBean AuthIdentityDao authIdentityDao;
    @MockitoBean UserProfileCreator profileCreator;

    @Autowired UserService userService;
    @Autowired AccountErasureService accountErasureService;
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
    @Autowired ErasureLedgerRepository erasureLedger;
    @Autowired PlatformTransactionManager transactionManager;

    @BeforeEach
    void setUp() {
        cleanup.deleteAll();
        photos.deleteAll();
        cards.deleteAll();
        storeNameUsages.deleteAll();
        storeNames.deleteAll();
        favoriteStores.deleteAll();
        erasureLedger.deleteAll();
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

    @Test
    void deleteAccountLeavesATombstoneWithOnlyTheIdAndTime() {
        User user = users.save(User.builder().id(UUID.randomUUID()).username("marko").build());

        userService.deleteAccount(user.getId());

        assertThat(erasureLedger.findAll()).singleElement().satisfies(entry -> {
            assertThat(entry.getUserId()).isEqualTo(user.getId());
            assertThat(entry.getErasedAt()).isNotNull();
        });
    }

    @Test
    void aRetriedDeletionSucceedsAndKeepsOneTombstone() {
        User user = users.save(User.builder().id(UUID.randomUUID()).username("marko").build());
        userService.deleteAccount(user.getId());
        var firstErasedAt = erasureLedger.findById(user.getId()).orElseThrow().getErasedAt();

        userService.deleteAccount(user.getId());

        assertThat(erasureLedger.findAll()).singleElement()
                .satisfies(entry -> assertThat(entry.getErasedAt()).isEqualTo(firstErasedAt));
        assertThat(users.findById(user.getId()).orElseThrow().getDeletedAt()).isNotNull();
    }

    @Test
    void anIdentityThatNeverGotAProfileCanStillBeDeleted() {
        UUID neverProvisioned = UUID.randomUUID();

        userService.deleteAccount(neverProvisioned);

        assertThat(users.findById(neverProvisioned)).isEmpty();
        assertThat(erasureLedger.findById(neverProvisioned)).isPresent();
    }

    @Test
    void aStaleLoginForAnErasedAccountIsToldSoInsteadOfRevivingIt() {
        User user = users.save(User.builder().id(UUID.randomUUID()).username("marko").build());
        userService.deleteAccount(user.getId());

        assertThatThrownBy(() -> userService.ensureActiveProfile(user.getId(), "marko@example.com", "Marko", null))
                .isInstanceOf(AccountErasedException.class);

        assertThat(users.findById(user.getId()).orElseThrow().getDeletedAt()).isNotNull();
    }

    @Test
    void aProfileSoftDeletedBeforeTheLedgerExistedIsNotRevived() {
        LocalDateTime deletedAt = Timestamps.nowUtc().minusDays(30).truncatedTo(ChronoUnit.MILLIS);
        User user = users.save(User.builder().id(UUID.randomUUID()).deletedAt(deletedAt).build());

        assertThatThrownBy(() -> userService.ensureActiveProfile(user.getId(), "marko@example.com", "Marko", null))
                .isInstanceOf(AccountErasedException.class);

        assertThat(users.findById(user.getId()).orElseThrow().getDeletedAt()).isEqualTo(deletedAt);
    }

    @Test
    void anErasedIdentityWithoutAProfileGetsNoNewOne() {
        UUID neverProvisioned = UUID.randomUUID();
        userService.deleteAccount(neverProvisioned);

        assertThatThrownBy(() -> userService.ensureActiveProfile(neverProvisioned, "ana@example.com", "Ana", null))
                .isInstanceOf(AccountErasedException.class);

        verify(profileCreator, never()).create(any());
    }

    @Test
    void twoConcurrentDeletionsOfAnIdentityWithoutAProfileBothSucceed() throws Exception {
        UUID neverProvisioned = UUID.randomUUID();
        CountDownLatch firstHasWritten = new CountDownLatch(1);
        CountDownLatch releaseFirst = new CountDownLatch(1);
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        ExecutorService pool = Executors.newFixedThreadPool(2);

        try {
            // The first deletion writes its tombstone, then holds its transaction open.
            Future<?> first = pool.submit(() -> transaction.executeWithoutResult(status -> {
                userService.deleteAccount(neverProvisioned);
                erasureLedger.flush();
                firstHasWritten.countDown();
                await(releaseFirst);
            }));
            await(firstHasWritten);
            // The second one sees no committed tombstone, so it writes one too and has to wait.
            Future<?> second = pool.submit(() -> accountErasureService.erase(neverProvisioned));
            Thread.sleep(300);
            // Still waiting on the first one's uncommitted tombstone, so the collision really happens.
            assertThat(second.isDone()).isFalse();
            releaseFirst.countDown();

            first.get(10, TimeUnit.SECONDS);
            second.get(10, TimeUnit.SECONDS);
        } finally {
            releaseFirst.countDown();
            pool.shutdownNow();
        }

        assertThat(erasureLedger.findAll()).singleElement()
                .satisfies(entry -> assertThat(entry.getUserId()).isEqualTo(neverProvisioned));
    }

    @Test
    void aRetryDoesNotHideAnUnrelatedIntegrityViolation() {
        UUID erased = UUID.randomUUID();
        userService.deleteAccount(erased);
        AccountErasureService withFailingErase = new AccountErasureService(failingUserService(), erasureLedger);

        assertThatThrownBy(() -> withFailingErase.erase(erased))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private static UserService failingUserService() {
        UserService failing = mock(UserService.class);
        doThrow(new DataIntegrityViolationException("card constraint")).when(failing).deleteAccount(any());
        return failing;
    }

    private static void await(CountDownLatch latch) {
        try {
            assertThat(latch.await(10, TimeUnit.SECONDS)).isTrue();
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(interrupted);
        }
    }

    @Test
    void anAdminCannotDeleteAnUnknownUser() {
        User admin = users.save(User.builder().id(UUID.randomUUID()).username("admin").build());
        UUID unknown = UUID.randomUUID();

        assertThatThrownBy(() -> userService.deleteUserAsAdmin(unknown, admin.getId()))
                .isInstanceOf(BadRequestException.class);

        assertThat(erasureLedger.findAll()).isEmpty();
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
