package disscount.storeName.service;

import disscount.storeName.dao.StoreNameSuggestionRepository;
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

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(showSql = false)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({StoreNameService.class, StoreNameUpsert.class})
class StoreNameServiceTest {

    @Autowired StoreNameService service;
    @Autowired StoreNameSuggestionRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void recordCountsRepeatsCaseAndDiacriticInsensitively() {
        service.record("Žabac");
        service.record(" zabac ");
        service.record("ZABAC");

        assertThat(repository.findAll()).singleElement().satisfies(s -> {
            assertThat(s.getName()).isEqualTo("Žabac");
            assertThat(s.getUseCount()).isEqualTo(3);
        });
    }

    @Test
    void searchPutsPrefixMatchesFirstThenPopularityAndHidesHidden() {
        for (int i = 0; i < 3; i++) service.record("Mali dućan");
        service.record("Dućan kod Ive");
        service.record("Studenac");
        service.record("Sakriven dućan");
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
        service.record("Pola_pola");
        service.record("Poladvapola");

        assertThat(service.search("a_p")).extracting(StoreNameSuggestionDto::getName).containsExactly("Pola_pola");
        assertThat(service.search("%")).isEmpty();
    }

    @Test
    void searchIsCappedAtFifty() {
        for (int i = 0; i < 60; i++) service.record("Dućan " + i);

        assertThat(service.search("dućan")).hasSize(50);
    }
}
