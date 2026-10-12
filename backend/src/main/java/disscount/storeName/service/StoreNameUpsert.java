package disscount.storeName.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import disscount.storeName.dao.StoreNameSuggestionRepository;
import disscount.storeName.domain.StoreNameSuggestion;
import disscount.util.Timestamps;

/** Its own bean so the REQUIRES_NEW boundary goes through the proxy. */
@Service
@RequiredArgsConstructor
public class StoreNameUpsert {

    private final StoreNameSuggestionRepository repository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void upsert(String name, String normalized) {
        if (repository.incrementUseCount(normalized, Timestamps.nowUtc()) > 0) {
            return;
        }

        repository.saveAndFlush(StoreNameSuggestion.builder()
                .name(name)
                .normalizedName(normalized)
                .useCount(1)
                .build());
    }
}
