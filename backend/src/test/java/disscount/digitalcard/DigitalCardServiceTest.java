package disscount.digitalcard;

import disscount.config.UploadLimitConfig;
import disscount.shared.BadRequestException;
import disscount.shared.ConflictException;
import disscount.shared.FakePhotoStore;
import disscount.shared.NotFoundException;
import disscount.shared.PhotoStore;
import disscount.shared.PhotoValidator;
import disscount.shared.TestImages;
import disscount.shared.Timestamps;
import disscount.storename.StoreNameService;
import disscount.storename.StoreNameSuggestionRepository;
import disscount.storename.StoreNameUpsert;
import disscount.storename.StoreNameUsageRepository;
import disscount.support.IncludingDeleted;
import disscount.user.ActiveUsers;
import disscount.user.User;
import disscount.user.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.jdbc.JdbcTestUtils;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.function.Supplier;
import java.util.stream.IntStream;

import static disscount.digitalcard.CardServiceTestSupport.request;
import static disscount.digitalcard.CardServiceTestSupport.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Not transactional on purpose: photo cleanup runs after commit, so the service has to really commit.
@DataJpaTest(showSql = false)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({ActiveUsers.class, DigitalCardService.class, DigitalCardPhotoService.class, DigitalCardMapper.class,
        StoreNameService.class, StoreNameUpsert.class, PhotoValidator.class, UploadLimitConfig.class,
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
    @Autowired StoreNameUsageRepository storeNameUsages;
    @Autowired PhotoStore store;
    @Autowired PhotoCleanupRepository cleanupRows;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager entityManager;

    User owner;
    User stranger;

    @BeforeEach
    void setUp() {
        cleanupRows.deleteAll();
        // Row by row would skip soft-deleted rows, which @SQLRestriction hides from JPA.
        JdbcTestUtils.deleteFromTables(jdbc, "wallet_card_photo", "wallet_card", "app_user");
        storeNameUsages.deleteAll();
        storeNames.deleteAll();
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

        assertThat(created.id()).isEqualTo(id);
        // The database keeps microseconds, the freshly created entity still carries nanoseconds.
        assertThat(replay.createdAt()).isCloseTo(created.createdAt(), within(1, ChronoUnit.MILLIS));
        assertThat(edited.cardName()).isEqualTo("Preimenovana");
        assertThat(edited.balance()).isEqualByComparingTo("12.50");
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
        assertThat(service.get(owner.getId(), id).cardName()).isEqualTo("Privatna");
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
        assertThat(IncludingDeleted.find(entityManager, DigitalCard.class, id)).isPresent();
    }

    // The deleted row is hidden from findById but keeps its id, so a create would otherwise collide on the key.
    @Test
    void aReplayedCreateOfADeletedIdIsNotFoundForEveryUser() {
        UUID id = UUID.randomUUID();
        service.upsert(owner.getId(), id, request("Obrisana"));
        service.delete(owner.getId(), id);

        assertThatThrownBy(() -> service.upsert(stranger.getId(), id, request("Tuđa")))
                .isInstanceOf(NotFoundException.class);
        assertThat(IncludingDeleted.find(entityManager, DigitalCard.class, id)).get()
                .satisfies(card -> assertThat(card.getUserId()).isEqualTo(owner.getId()));
    }

    @Test
    void togglesAfterADeleteAreNotFoundAndDoNotResurrect() {
        UUID id = UUID.randomUUID();
        service.upsert(owner.getId(), id, request("Obrisana"));
        service.delete(owner.getId(), id);

        assertThatThrownBy(() -> service.setPinned(owner.getId(), id, true)).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.setArchived(owner.getId(), id, true)).isInstanceOf(NotFoundException.class);
        assertThat(IncludingDeleted.find(entityManager, DigitalCard.class, id)).get().satisfies(card -> {
            assertThat(card.getDeletedAt()).isNotNull();
            assertThat(card.getPinnedAt()).isNull();
            assertThat(card.getArchivedAt()).isNull();
        });
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

        assertThat(list).extracting(DigitalCardDto::id).containsExactlyInAnyOrder(kept, archived);
        assertThat(list.stream().filter(c -> c.id().equals(archived)).findFirst().orElseThrow().archivedAt())
                .isNotNull();
        assertThat(service.list(stranger.getId())).isEmpty();
    }

    @Test
    void pinAndArchiveToggle() {
        UUID id = UUID.randomUUID();
        service.upsert(owner.getId(), id, request("Kartica"));

        assertThat(service.setPinned(owner.getId(), id, true).pinnedAt()).isNotNull();
        assertThat(service.setPinned(owner.getId(), id, false).pinnedAt()).isNull();
        assertThat(service.setArchived(owner.getId(), id, true).archivedAt()).isNotNull();
        assertThat(service.setArchived(owner.getId(), id, false).archivedAt()).isNull();
    }

    @Test
    void writesReturnTheUpdatedAtTheyStored() {
        UUID id = UUID.randomUUID();
        service.upsert(owner.getId(), id, request("Kartica"));
        List<Supplier<DigitalCardDto>> writes = List.of(
                () -> service.upsert(owner.getId(), id, request("Preimenovana")),
                () -> service.setPinned(owner.getId(), id, true),
                () -> service.setArchived(owner.getId(), id, true));

        for (Supplier<DigitalCardDto> write : writes) {
            // Backdated so a reply built before the flush cannot match by luck.
            jdbc.update("UPDATE wallet_card SET updated_at = ? WHERE id = ?",
                    Timestamps.nowUtc().minusHours(1), id);

            DigitalCardDto returned = write.get();

            // The database rounds to microseconds; a reply built before the flush misses the commit stamp by far more.
            assertThat(returned.updatedAt())
                    .isCloseTo(service.get(owner.getId(), id).updatedAt(), within(1, ChronoUnit.MICROS));
        }
    }

    @Test
    void pinAndArchiveDoNotTouchUpdatedAt() {
        UUID id = UUID.randomUUID();
        service.upsert(owner.getId(), id, request("Kartica"));
        LocalDateTime edited = Timestamps.nowUtc().minusHours(1);
        jdbc.update("UPDATE wallet_card SET updated_at = ? WHERE id = ?", edited, id);

        List<DigitalCardDto> replies = List.of(
                service.setPinned(owner.getId(), id, true),
                service.setArchived(owner.getId(), id, true),
                service.setPinned(owner.getId(), id, false),
                service.setArchived(owner.getId(), id, false));

        for (DigitalCardDto reply : replies) {
            assertThat(reply.updatedAt()).isCloseTo(edited, within(1, ChronoUnit.MILLIS));
        }
        assertThat(service.get(owner.getId(), id).updatedAt()).isCloseTo(edited, within(1, ChronoUnit.MILLIS));
    }

    @Test
    void capsActiveCardsAtThreeHundred() {
        cards.saveAll(IntStream.range(0, 300).mapToObj(i -> DigitalCard.builder()
                .id(UUID.randomUUID()).userId(owner.getId()).cardName("Kartica " + i).cardType("other")
                .storeName("Dućan").codeValue("1").codeType("unknown").cardColor("#616161").build()).toList());

        assertThatThrownBy(() -> service.upsert(owner.getId(), UUID.randomUUID(), request("Višak")))
                .isInstanceOf(ConflictException.class)
                .hasMessage("error.card.limitReached");

        // Editing an existing card at the cap is still allowed.
        UUID existing = cards.findActiveByUserId(owner.getId()).get(0).getId();
        assertThat(service.upsert(owner.getId(), existing, request("Preimenovana")).cardName())
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
        assertThat(after.lastUsedAt()).isCloseTo(LocalDateTime.ofInstant(later, ZoneOffset.UTC), within(1, ChronoUnit.MILLIS));
        assertThat(after.updatedAt()).isCloseTo(before.updatedAt(), within(1, ChronoUnit.MILLIS));
    }

    @Test
    void usedAtIsClampedToNowAndIgnoresForeignCards() {
        UUID id = UUID.randomUUID();
        service.upsert(owner.getId(), id, request("Kartica"));

        service.recordUsed(owner.getId(), List.of(new CardUsedEntry(id, Instant.now().plusSeconds(86_400))));
        service.recordUsed(stranger.getId(), List.of(new CardUsedEntry(id, Instant.now())));

        assertThat(service.get(owner.getId(), id).lastUsedAt()).isBeforeOrEqualTo(Timestamps.nowUtc());
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
        assertThat(service.get(owner.getId(), id).photos()).hasSize(2);

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
        jdbc.update("UPDATE wallet_card SET deleted_at = ? WHERE id = ?", Timestamps.nowUtc().minusDays(31), old);

        int purged = service.purgeDeletedBefore(Timestamps.nowUtc().minusDays(30));

        assertThat(purged).isEqualTo(1);
        assertThat(IncludingDeleted.find(entityManager, DigitalCard.class, old)).isEmpty();
        assertThat(IncludingDeleted.find(entityManager, DigitalCard.class, recent)).isPresent();
    }

    // Deleting a card removes its photos, so a photo row on a hidden card is a leftover the purge must still take.
    @Test
    void aPhotoStillOnADeletedCardIsHiddenAndPurgedWithIt() {
        UUID id = UUID.randomUUID();
        service.upsert(owner.getId(), id, request("Stara"));
        photoService.upload(owner.getId(), id, "icon", file(TestImages.webp(32, 32)), null);
        jdbc.update("UPDATE wallet_card SET deleted_at = ? WHERE id = ?", Timestamps.nowUtc().minusDays(31), id);

        // JPQL reaches a photo through its card, so the hidden card hides the photo from reads too.
        assertThat(photos.findByCardId(id)).isEmpty();

        assertThat(service.purgeDeletedBefore(Timestamps.nowUtc().minusDays(30))).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM wallet_card_photo", Long.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM wallet_card", Long.class)).isZero();
    }

    @Test
    void storeNameIsRecordedOnlyForCustomStores() {
        service.upsert(owner.getId(), UUID.randomUUID(), request("Lanac"));
        DigitalCardRequest custom = request("Moja trgovina").toBuilder()
                .chainCode(null)
                .storeName("  Žabac   dućan ")
                .build();

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
        DigitalCardRequest custom = request("Zajednička").toBuilder().chainCode(null).build();

        List<Throwable> failures = runConcurrently(6, i -> service.upsert(owner.getId(), id, custom));

        assertThat(failures).isEmpty();
        assertThat(cards.findActiveByUserId(owner.getId())).hasSize(1);
        assertThat(storeNames.findAll()).singleElement().satisfies(s -> assertThat(s.getUseCount()).isEqualTo(1));
    }

    @Test
    void concurrentCreatesCannotPassTheCap() throws Exception {
        cards.saveAll(IntStream.range(0, 299).mapToObj(i -> DigitalCard.builder()
                .id(UUID.randomUUID()).userId(owner.getId()).cardName("Kartica " + i).cardType("other")
                .storeName("Dućan").codeValue("1").codeType("unknown").cardColor("#616161").build()).toList());

        List<Throwable> failures = runConcurrently(6,
                i -> service.upsert(owner.getId(), UUID.randomUUID(), request("Nova " + i)));

        assertThat(failures).hasSize(5).allMatch(e -> e instanceof ConflictException);
        assertThat(cards.countActiveByUserId(owner.getId())).isEqualTo(300);
    }

    @Test
    void storeNameCountsOnlyCreationsAndRenames() {
        UUID id = UUID.randomUUID();
        DigitalCardRequest custom = request("Moja trgovina").toBuilder()
                .chainCode(null)
                .storeName("Žabac dućan")
                .build();

        service.upsert(owner.getId(), id, custom);
        service.upsert(owner.getId(), id, custom);
        custom = custom.toBuilder().cardName("Preimenovana").build();
        service.upsert(owner.getId(), id, custom);
        assertThat(storeNames.findAll()).singleElement().satisfies(s -> assertThat(s.getUseCount()).isEqualTo(1));

        custom = custom.toBuilder().storeName("Drugi dućan").build();
        service.upsert(owner.getId(), id, custom);
        assertThat(storeNames.findAll()).hasSize(2);

        // Switching a chain card to a custom store with the same name is a new use of that name.
        UUID chainCard = UUID.randomUUID();
        service.upsert(owner.getId(), chainCard, request("Lanac"));
        DigitalCardRequest switched = request("Lanac").toBuilder().chainCode(null).build();
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

        assertThat(service.get(owner.getId(), id).lastUsedAt())
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
