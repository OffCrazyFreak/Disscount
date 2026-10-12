package disscount.storeName.service;

import disscount.exceptions.BadRequestException;
import disscount.storeName.dao.StoreNameSuggestionRepository;
import disscount.storeName.dao.StoreNameUsageRepository;
import disscount.storeName.domain.StoreNameSuggestion;
import disscount.storeName.dto.StoreNameSuggestionDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest(showSql = false)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({StoreNameService.class, StoreNameUpsert.class})
class StoreNameServiceTest {

    @Autowired StoreNameService service;
    @Autowired StoreNameSuggestionRepository repository;
    @Autowired StoreNameUsageRepository usages;

    @BeforeEach
    void setUp() {
        usages.deleteAll();
        repository.deleteAll();
    }

    @Test
    void recordCountsDistinctUsersCaseAndDiacriticInsensitively() {
        service.record(UUID.randomUUID(), "Žabac");
        service.record(UUID.randomUUID(), " zabac ");
        service.record(UUID.randomUUID(), "ZABAC");

        assertThat(repository.findAll()).singleElement().satisfies(s -> {
            assertThat(s.getName()).isEqualTo("Žabac");
            assertThat(s.getUseCount()).isEqualTo(3);
        });
    }

    @Test
    void searchPutsPrefixMatchesFirstThenPopularityAndHidesHidden() {
        for (int i = 0; i < 3; i++) service.record(UUID.randomUUID(), "Mali dućan");
        for (int i = 0; i < 2; i++) service.record(UUID.randomUUID(), "Dućan kod Ive");
        for (int i = 0; i < 2; i++) service.record(UUID.randomUUID(), "Studenac");
        for (int i = 0; i < 2; i++) service.record(UUID.randomUUID(), "Sakriven dućan");
        StoreNameSuggestion hidden = repository.findAll().stream()
                .filter(s -> s.getName().startsWith("Sakriven")).findFirst().orElseThrow();
        hidden.setHidden(true);
        repository.save(hidden);

        List<String> names = service.search("DUCAN").stream().map(StoreNameSuggestionDto::getName).toList();

        assertThat(names).containsExactly("Dućan kod Ive", "Mali dućan");
        assertThat(service.search("").stream().map(StoreNameSuggestionDto::getName))
                .startsWith("Mali dućan").doesNotContain("Sakriven dućan");
    }

    @Test
    void searchTreatsWildcardsLiterally() {
        for (int i = 0; i < 2; i++) {
            service.record(UUID.randomUUID(), "Pola_pola");
            service.record(UUID.randomUUID(), "Poladvapola");
        }

        assertThat(service.search("a_p")).extracting(StoreNameSuggestionDto::getName).containsExactly("Pola_pola");
        assertThat(service.search("%")).isEmpty();
    }

    @Test
    void searchIsCappedAtFifty() {
        for (int i = 0; i < 60; i++) {
            service.record(UUID.randomUUID(), "Dućan " + i);
            service.record(UUID.randomUUID(), "Dućan " + i);
        }

        assertThat(service.search("dućan")).hasSize(50);
    }

    @Test
    void aNameUsedOnceIsNotOfferedUntilASecondUse() {
        service.record(UUID.randomUUID(), "Samo moja trgovina");

        assertThat(service.search("")).isEmpty();
        assertThat(service.search("moja")).isEmpty();

        service.record(UUID.randomUUID(), "samo moja trgovina");

        assertThat(service.search("moja")).extracting(StoreNameSuggestionDto::getName)
                .containsExactly("Samo moja trgovina");
    }

    @Test
    void nulCharactersAreRejectedInSearchAndIgnoredWhenRecording() {
        assertThatThrownBy(() -> service.search("ab\u0000c")).isInstanceOf(BadRequestException.class);

        service.record(UUID.randomUUID(), "Ab\u0000c dućan");
        service.record(UUID.randomUUID(), "Ab\u0000c dućan");

        assertThat(repository.findAll()).isEmpty();
    }

    @Test
    void oneUserRecordingTheSameNameTwiceCountsOnceAndStaysHidden() {
        UUID user = UUID.randomUUID();
        service.record(user, "Moja trgovina");
        service.record(user, " MOJA trgovina ");

        assertThat(repository.findAll()).singleElement().satisfies(s -> assertThat(s.getUseCount()).isEqualTo(1));
        assertThat(usages.findAll()).hasSize(1);
        assertThat(service.search("")).isEmpty();
        assertThat(service.search("moja")).isEmpty();
    }

    @Test
    void twoDifferentUsersMakeANameVisible() {
        service.record(UUID.randomUUID(), "Zajednička trgovina");
        service.record(UUID.randomUUID(), "Zajednička trgovina");

        assertThat(service.search("zajed")).extracting(StoreNameSuggestionDto::getName)
                .containsExactly("Zajednička trgovina");
    }

    @Test
    void concurrentRecordsByOneUserCountOnce() throws Exception {
        UUID user = UUID.randomUUID();
        int threads = 6;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<?>> runs = new java.util.ArrayList<>();
            for (int i = 0; i < threads; i++) {
                runs.add(pool.submit(() -> {
                    start.await();
                    service.record(user, "Utrka trgovina");
                    return null;
                }));
            }
            start.countDown();
            for (Future<?> run : runs) run.get();
        } finally {
            pool.shutdownNow();
        }

        assertThat(repository.findAll()).singleElement().satisfies(s -> assertThat(s.getUseCount()).isEqualTo(1));
        assertThat(usages.findAll()).hasSize(1);
    }

    @Test
    void forgettingAUserRemovesTheirUsageAndTakesBackTheirCount() {
        UUID leaving = UUID.randomUUID();
        service.record(leaving, "Odlazak trgovina");
        service.record(UUID.randomUUID(), "Odlazak trgovina");
        assertThat(service.search("odlazak")).hasSize(1);

        service.forgetUser(leaving);

        assertThat(usages.findAll()).hasSize(1).noneMatch(u -> u.getUserId().equals(leaving));
        assertThat(repository.findAll()).singleElement().satisfies(s -> assertThat(s.getUseCount()).isEqualTo(1));
        assertThat(service.search("odlazak")).isEmpty();
    }
}
