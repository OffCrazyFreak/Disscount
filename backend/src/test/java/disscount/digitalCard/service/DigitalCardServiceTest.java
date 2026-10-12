package disscount.digitalCard.service;

import disscount.digitalCard.dao.DigitalCardPhotoRepository;
import disscount.digitalCard.dao.DigitalCardRepository;
import disscount.digitalCard.dao.PhotoCleanupRepository;
import disscount.digitalCard.domain.DigitalCard;
import disscount.digitalCard.dto.CardUsedEntry;
import disscount.digitalCard.dto.DigitalCardDto;
import disscount.digitalCard.dto.DigitalCardRequest;
import disscount.digitalCard.photo.PhotoValidator;
import disscount.digitalCard.photo.TestImages;
import disscount.digitalCard.storage.PhotoStore;
import disscount.exceptions.BadRequestException;
import disscount.exceptions.ConflictException;
import disscount.exceptions.NotFoundException;
import disscount.storeName.dao.StoreNameSuggestionRepository;
import disscount.storeName.service.StoreNameService;
import disscount.storeName.service.StoreNameUpsert;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import disscount.util.Timestamps;
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

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

import static disscount.digitalCard.service.CardServiceTestSupport.request;
import static disscount.digitalCard.service.CardServiceTestSupport.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Not transactional on purpose: R2 cleanup runs after commit, so the service has to really commit.
@DataJpaTest(showSql = false)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({DigitalCardService.class, DigitalCardPhotoService.class, DigitalCardMapper.class,
        StoreNameService.class, StoreNameUpsert.class, PhotoValidator.class, PhotoUploadRateLimiter.class,
        CardPhotoWriter.class, CardUserLock.class, PhotoCleanupService.class,
        DigitalCardServiceTest.StoreConfig.class})
class DigitalCardServiceTest {

    @TestConfiguration
    static class StoreConfig {
        @Bean
        FakePhotoStore photoStore() {
            return new FakePhotoStore();
        }
    }

    @Autowired DigitalCardService service;
    @Autowired DigitalCardPhotoService photoService;
    @Autowired DigitalCardRepository cards;
    @Autowired DigitalCardPhotoRepository photos;
    @Autowired UserRepository users;
    @Autowired StoreNameSuggestionRepository storeNames;
    @Autowired PhotoStore store;
    @Autowired PhotoCleanupRepository cleanupRows;

    User owner;
    User stranger;

    @BeforeEach
    void setUp() {
        cleanupRows.deleteAll();
        photos.deleteAll();
        cards.deleteAll();
        storeNames.deleteAll();
        users.deleteAll();
        ((FakePhotoStore) store).objects.clear();
        ((FakePhotoStore) store).enabled = true;
        ((FakePhotoStore) store).failDeletes = false;
        owner = users.save(user());
        stranger = users.save(user());
    }

    @Test
    void putIsIdempotentAndUpdatesInPlace() {
        UUID id = UUID.randomUUID();

        DigitalCardDto created = service.upsert(owner.getId(), id, request("Moja kartica"));
        DigitalCardDto replay = service.upsert(owner.getId(), id, request("Moja kartica"));
        DigitalCardDto edited = service.upsert(owner.getId(), id, request("Preimenovana"));

        assertThat(created.getId()).isEqualTo(id);
        // The database keeps microseconds, the freshly created entity still carries nanoseconds.
        assertThat(replay.getCreatedAt()).isCloseTo(created.getCreatedAt(), within(1, ChronoUnit.MILLIS));
        assertThat(edited.getCardName()).isEqualTo("Preimenovana");
        assertThat(edited.getBalance()).isEqualByComparingTo("12.50");
        assertThat(service.list(owner.getId())).hasSize(1);
    }

    @Test
    void anotherUsersIdIsNotFoundAndLeavesTheCardUntouched() {
        UUID id = UUID.randomUUID();
        service.upsert(owner.getId(), id, request("Privatna"));

        assertThatThrownBy(() -> service.upsert(stranger.getId(), id, request("Preuzeta")))
                .isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.get(stranger.getId(), id)).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.delete(stranger.getId(), id)).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.setPinned(stranger.getId(), id, true)).isInstanceOf(NotFoundException.class);
        assertThat(service.get(owner.getId(), id).getCardName()).isEqualTo("Privatna");
    }

    @Test
    void softDeletedIdIsNotFoundAndNeverResurrected() {
        UUID id = UUID.randomUUID();
        service.upsert(owner.getId(), id, request("Obrisana"));
        service.delete(owner.getId(), id);

        assertThatThrownBy(() -> service.upsert(owner.getId(), id, request("Opet")))
                .isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.get(owner.getId(), id)).isInstanceOf(NotFoundException.class);
        assertThat(service.list(owner.getId())).isEmpty();
        assertThat(cards.findById(id)).isPresent();
    }

    @Test
    void listIncludesArchivedAndSkipsDeleted() {
        UUID kept = UUID.randomUUID();
        UUID archived = UUID.randomUUID();
        UUID deleted = UUID.randomUUID();
        service.upsert(owner.getId(), kept, request("Aktivna"));
        service.upsert(owner.getId(), archived, request("Arhivirana"));
        service.upsert(owner.getId(), deleted, request("Obrisana"));
        service.setArchived(owner.getId(), archived, true);
        service.delete(owner.getId(), deleted);

        List<DigitalCardDto> list = service.list(owner.getId());

        assertThat(list).extracting(DigitalCardDto::getId).containsExactlyInAnyOrder(kept, archived);
        assertThat(list.stream().filter(c -> c.getId().equals(archived)).findFirst().orElseThrow().getArchivedAt())
                .isNotNull();
        assertThat(service.list(stranger.getId())).isEmpty();
    }

    @Test
    void pinAndArchiveToggle() {
        UUID id = UUID.randomUUID();
        service.upsert(owner.getId(), id, request("Kartica"));

        assertThat(service.setPinned(owner.getId(), id, true).getPinnedAt()).isNotNull();
        assertThat(service.setPinned(owner.getId(), id, false).getPinnedAt()).isNull();
        assertThat(service.setArchived(owner.getId(), id, true).getArchivedAt()).isNotNull();
        assertThat(service.setArchived(owner.getId(), id, false).getArchivedAt()).isNull();
    }

    @Test
    void capsActiveCardsAtThreeHundred() {
        cards.saveAll(IntStream.range(0, 300).mapToObj(i -> DigitalCard.builder()
                .id(UUID.randomUUID()).user(owner).cardName("Kartica " + i).cardType("other")
                .storeName("Dućan").codeValue("1").codeType("unknown").cardColor("#616161").build()).toList());

        assertThatThrownBy(() -> service.upsert(owner.getId(), UUID.randomUUID(), request("Višak")))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Dosegnut je najveći broj kartica");

        // Editing an existing card at the cap is still allowed.
        UUID existing = cards.findActiveByUserId(owner.getId()).get(0).getId();
        assertThat(service.upsert(owner.getId(), existing, request("Preimenovana")).getCardName())
                .isEqualTo("Preimenovana");
    }

    @Test
    void usedAtKeepsTheLatestAndDoesNotTouchUpdatedAt() {
        UUID id = UUID.randomUUID();
        DigitalCardDto before = service.upsert(owner.getId(), id, request("Kartica"));
        Instant later = Instant.now().minusSeconds(60);
        Instant earlier = later.minusSeconds(3600);

        service.recordUsed(owner.getId(), List.of(new CardUsedEntry(id, later)));
        service.recordUsed(owner.getId(), List.of(new CardUsedEntry(id, earlier)));

        DigitalCardDto after = service.get(owner.getId(), id);
        // H2 rounds to microseconds rather than truncating, so compare within a millisecond.
        assertThat(after.getLastUsedAt()).isCloseTo(LocalDateTime.ofInstant(later, ZoneOffset.UTC), within(1, ChronoUnit.MILLIS));
        assertThat(after.getUpdatedAt()).isCloseTo(before.getUpdatedAt(), within(1, ChronoUnit.MILLIS));
    }

    @Test
    void usedAtIsClampedToNowAndIgnoresForeignCards() {
        UUID id = UUID.randomUUID();
        service.upsert(owner.getId(), id, request("Kartica"));

        service.recordUsed(owner.getId(), List.of(new CardUsedEntry(id, Instant.now().plusSeconds(86_400))));
        service.recordUsed(stranger.getId(), List.of(new CardUsedEntry(id, Instant.now())));

        assertThat(service.get(owner.getId(), id).getLastUsedAt()).isBeforeOrEqualTo(Timestamps.nowUtc());
    }

    @Test
    void usedBatchIsLimitedToFifty() {
        List<CardUsedEntry> tooMany = IntStream.range(0, 51)
                .mapToObj(i -> new CardUsedEntry(UUID.randomUUID(), Instant.now())).toList();

        assertThatThrownBy(() -> service.recordUsed(owner.getId(), tooMany)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void deletingACardRemovesItsPhotoRowsAndObjects() {
        UUID id = UUID.randomUUID();
        service.upsert(owner.getId(), id, request("Kartica"));
        photoService.upload(owner.getId(), id, "front", file(TestImages.webp(64, 64)), file(TestImages.webp(16, 16)));
        photoService.upload(owner.getId(), id, "icon", file(TestImages.webp(32, 32)), null);
        assertThat(((FakePhotoStore) store).objects).hasSize(3);
        assertThat(service.get(owner.getId(), id).getPhotos()).hasSize(2);

        service.delete(owner.getId(), id);

        assertThat(photos.findByCardId(id)).isEmpty();
        assertThat(((FakePhotoStore) store).objects).isEmpty();
    }

    @Test
    void purgeDeletesAccountDataEverywhere() {
        UUID mine = UUID.randomUUID();
        UUID theirs = UUID.randomUUID();
        service.upsert(owner.getId(), mine, request("Moja"));
        service.upsert(stranger.getId(), theirs, request("Tuđa"));
        photoService.upload(owner.getId(), mine, "icon", file(TestImages.webp(32, 32)), null);
        photoService.upload(stranger.getId(), theirs, "icon", file(TestImages.webp(32, 32)), null);

        service.deleteAllForUser(owner.getId());

        assertThat(cards.findById(mine)).isEmpty();
        assertThat(photos.findByCardId(mine)).isEmpty();
        assertThat(((FakePhotoStore) store).objects.keySet())
                .allMatch(k -> k.startsWith("cards/" + stranger.getId() + "/"))
                .hasSize(1);
        assertThat(service.list(stranger.getId())).hasSize(1);
    }

    @Test
    void scheduledPurgeOnlyTakesCardsDeletedLongAgo() {
        UUID old = UUID.randomUUID();
        UUID recent = UUID.randomUUID();
        service.upsert(owner.getId(), old, request("Stara"));
        service.upsert(owner.getId(), recent, request("Nedavna"));
        service.delete(owner.getId(), old);
        service.delete(owner.getId(), recent);
        DigitalCard oldCard = cards.findById(old).orElseThrow();
        oldCard.setDeletedAt(Timestamps.nowUtc().minusDays(31));
        cards.save(oldCard);

        int purged = service.purgeDeletedBefore(Timestamps.nowUtc().minusDays(30));

        assertThat(purged).isEqualTo(1);
        assertThat(cards.findById(old)).isEmpty();
        assertThat(cards.findById(recent)).isPresent();
    }

    @Test
    void storeNameIsRecordedOnlyForCustomStores() {
        service.upsert(owner.getId(), UUID.randomUUID(), request("Lanac"));
        DigitalCardRequest custom = request("Moja trgovina");
        custom.setChainCode(null);
        custom.setStoreName("  Žabac   dućan ");

        service.upsert(owner.getId(), UUID.randomUUID(), custom);
        service.upsert(stranger.getId(), UUID.randomUUID(), custom);

        assertThat(storeNames.findAll()).hasSize(1).first().satisfies(s -> {
            assertThat(s.getName()).isEqualTo("Žabac dućan");
            assertThat(s.getNormalizedName()).isEqualTo("zabac ducan");
            assertThat(s.getUseCount()).isEqualTo(2);
        });
    }

    private static MockMultipartFile file(byte[] bytes) {
        return new MockMultipartFile("full", "p.webp", "image/webp", bytes);
    }

    @Test
    void concurrentPutsOfOneIdAllSucceedAsUpdates() throws Exception {
        UUID id = UUID.randomUUID();
        DigitalCardRequest custom = request("Zajednička");
        custom.setChainCode(null);

        List<Throwable> failures = runConcurrently(6, i -> service.upsert(owner.getId(), id, custom));

        assertThat(failures).isEmpty();
        assertThat(cards.findActiveByUserId(owner.getId())).hasSize(1);
        assertThat(storeNames.findAll()).singleElement().satisfies(s -> assertThat(s.getUseCount()).isEqualTo(1));
    }

    @Test
    void concurrentCreatesCannotPassTheCap() throws Exception {
        cards.saveAll(IntStream.range(0, 299).mapToObj(i -> DigitalCard.builder()
                .id(UUID.randomUUID()).user(owner).cardName("Kartica " + i).cardType("other")
                .storeName("Dućan").codeValue("1").codeType("unknown").cardColor("#616161").build()).toList());

        List<Throwable> failures = runConcurrently(6,
                i -> service.upsert(owner.getId(), UUID.randomUUID(), request("Nova " + i)));

        assertThat(failures).hasSize(5).allMatch(e -> e instanceof ConflictException);
        assertThat(cards.countActiveByUserId(owner.getId())).isEqualTo(300);
    }

    @Test
    void storeNameCountsOnlyCreationsAndRenames() {
        UUID id = UUID.randomUUID();
        DigitalCardRequest custom = request("Moja trgovina");
        custom.setChainCode(null);
        custom.setStoreName("Žabac dućan");

        service.upsert(owner.getId(), id, custom);
        service.upsert(owner.getId(), id, custom);
        custom.setCardName("Preimenovana");
        service.upsert(owner.getId(), id, custom);
        assertThat(storeNames.findAll()).singleElement().satisfies(s -> assertThat(s.getUseCount()).isEqualTo(1));

        custom.setStoreName("Drugi dućan");
        service.upsert(owner.getId(), id, custom);
        assertThat(storeNames.findAll()).hasSize(2);

        // Switching a chain card to a custom store with the same name is a new use of that name.
        UUID chainCard = UUID.randomUUID();
        service.upsert(owner.getId(), chainCard, request("Lanac"));
        DigitalCardRequest switched = request("Lanac");
        switched.setChainCode(null);
        service.upsert(owner.getId(), chainCard, switched);
        assertThat(storeNames.findAll()).extracting("normalizedName").contains("konzum");
    }

    @Test
    void usedBatchRejectsEmptyListNullElementsAndClampsOldTimestamps() {
        UUID id = UUID.randomUUID();
        service.upsert(owner.getId(), id, request("Kartica"));

        assertThatThrownBy(() -> service.recordUsed(owner.getId(), List.of())).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.recordUsed(owner.getId(), java.util.Collections.singletonList(null)))
                .isInstanceOf(BadRequestException.class);

        service.recordUsed(owner.getId(), List.of(new CardUsedEntry(id, Instant.now().minus(3 * 365L, ChronoUnit.DAYS))));

        assertThat(service.get(owner.getId(), id).getLastUsedAt())
                .isCloseTo(Timestamps.nowUtc().minusDays(400), within(1, ChronoUnit.MINUTES));
    }

    private List<Throwable> runConcurrently(int threads, java.util.function.IntConsumer task) throws Exception {
        java.util.concurrent.ExecutorService pool = java.util.concurrent.Executors.newFixedThreadPool(threads);
        java.util.concurrent.CountDownLatch start = new java.util.concurrent.CountDownLatch(1);
        List<java.util.concurrent.Future<?>> futures = IntStream.range(0, threads).mapToObj(i -> pool.submit(() -> {
            start.await();
            task.accept(i);
            return null;
        })).collect(java.util.stream.Collectors.toList());
        start.countDown();

        List<Throwable> failures = new java.util.ArrayList<>();
        for (java.util.concurrent.Future<?> future : futures) {
            try {
                future.get(30, java.util.concurrent.TimeUnit.SECONDS);
            } catch (java.util.concurrent.ExecutionException e) {
                failures.add(e.getCause());
            }
        }
        pool.shutdown();
        return failures;
    }
}
