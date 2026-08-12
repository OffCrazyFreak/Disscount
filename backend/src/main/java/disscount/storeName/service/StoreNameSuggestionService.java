package disscount.storeName.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import disscount.storeName.dao.StoreNameSuggestionRepository;
import disscount.storeName.domain.StoreNameSuggestion;
import disscount.storeName.dto.StoreNameSuggestionDto;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StoreNameSuggestionService {

    // TODO(store-names): raise to 2 once there is enough volume, so a single typo does
    // not reach everyone. 1 at launch, otherwise the suggestion group starts empty.
    private static final int MIN_PUBLIC_USAGE = 1;

    private static final int MAX_SUGGESTIONS = 200;

    private static final int MAX_NAME_LENGTH = 60;

    private final StoreNameSuggestionRepository storeNameSuggestionRepository;

    /**
     * Best-effort: recording a suggestion must never fail the card save that triggered it.
     * REQUIRES_NEW is load-bearing, not stylistic. A concurrent insert on the unique
     * normalized_name marks the *current* transaction rollback-only even when the
     * exception is caught, so without its own transaction this would poison the caller.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String rawName) {
        String normalized = StoreNameNormalizer.normalize(rawName);
        if (normalized.isBlank() || normalized.length() > MAX_NAME_LENGTH) {
            return;
        }

        try {
            StoreNameSuggestion suggestion = storeNameSuggestionRepository
                    .findByNormalizedName(normalized)
                    .orElse(null);

            if (suggestion == null) {
                storeNameSuggestionRepository.save(StoreNameSuggestion.builder()
                        .name(StoreNameNormalizer.toDisplayForm(rawName))
                        .normalizedName(normalized)
                        .usageCount(1)
                        .build());
                return;
            }

            suggestion.setUsageCount(suggestion.getUsageCount() + 1);
            storeNameSuggestionRepository.save(suggestion);
        } catch (Exception e) {
            log.warn("Could not record store name suggestion '{}'", normalized, e);
        }
    }

    @Transactional(readOnly = true)
    public List<StoreNameSuggestionDto> listVisible() {
        return storeNameSuggestionRepository
                .findVisible(MIN_PUBLIC_USAGE, PageRequest.of(0, MAX_SUGGESTIONS))
                .stream()
                .map(suggestion -> StoreNameSuggestionDto.builder()
                        .name(suggestion.getName())
                        .usageCount(suggestion.getUsageCount())
                        .build())
                .toList();
    }
}
