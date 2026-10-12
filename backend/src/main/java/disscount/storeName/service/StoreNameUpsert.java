package disscount.storeName.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import disscount.storeName.dao.StoreNameSuggestionRepository;
import disscount.storeName.dao.StoreNameUsageRepository;
import disscount.storeName.domain.StoreNameSuggestion;
import disscount.storeName.domain.StoreNameUsage;
import disscount.util.Timestamps;

import java.util.UUID;

/** Its own bean so the REQUIRES_NEW boundary goes through the proxy. */
@Service
@RequiredArgsConstructor
public class StoreNameUpsert {

    private final StoreNameSuggestionRepository repository;
    private final StoreNameUsageRepository usages;

    /** A duplicate usage insert (same user racing itself) throws and rolls back; the caller retries and finds the row. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void upsert(UUID userId, String name, String normalized) {
        StoreNameSuggestion suggestion = repository.findByNormalizedName(normalized).orElse(null);

        if (suggestion == null) {
            suggestion = repository.saveAndFlush(StoreNameSuggestion.builder()
                    .name(name)
                    .normalizedName(normalized)
                    .useCount(1)
                    .build());
            usages.saveAndFlush(usage(userId, suggestion));
            return;
        }

        if (usages.existsByUser(userId, suggestion.getId())) {
            return;
        }

        usages.saveAndFlush(usage(userId, suggestion));
        repository.incrementUseCount(normalized, Timestamps.nowUtc());
    }

    private static StoreNameUsage usage(UUID userId, StoreNameSuggestion suggestion) {
        return StoreNameUsage.builder().userId(userId).suggestion(suggestion).build();
    }
}
