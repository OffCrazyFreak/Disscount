package disscount.storeName.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.exceptions.BadRequestException;
import disscount.storeName.dao.StoreNameSuggestionRepository;
import disscount.storeName.dao.StoreNameUsageRepository;
import disscount.storeName.domain.StoreNameSuggestion;
import disscount.storeName.dto.StoreNameSuggestionDto;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StoreNameService {

    private static final int MAX_RESULTS = 50;
    private static final int MAX_NAME_LENGTH = 60;

    private final StoreNameSuggestionRepository repository;
    private final StoreNameUsageRepository usageRepository;
    private final StoreNameUpsert upsert;

    /**
     * Runs in its own transaction so a duplicate-key race cannot roll back the card save that
     * triggered it. The loser of the race retries once, when the winner's row is visible.
     */
    public void record(UUID userId, String name) {
        String cleaned = StoreNameNormalizer.clean(name);
        String normalized = StoreNameNormalizer.normalize(name);
        if (normalized.length() < 2 || cleaned.length() > MAX_NAME_LENGTH || cleaned.indexOf('\u0000') >= 0) {
            return;
        }

        try {
            upsert.upsert(userId, cleaned, normalized);
        } catch (DataIntegrityViolationException race) {
            upsert.upsert(userId, cleaned, normalized);
        }
    }

    /** Joins the caller's transaction so the usage rows and the counts they gave go together. */
    @Transactional
    public void forgetUser(UUID userId) {
        repository.decrementForUser(userId);
        usageRepository.deleteAllByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<StoreNameSuggestionDto> search(String query) {
        if (query != null && query.indexOf('\u0000') >= 0) {
            throw new BadRequestException("Pretraga sadrži nedopušten znak");
        }
        String normalized = StoreNameNormalizer.normalize(query == null ? "" : query);
        if (normalized.length() > MAX_NAME_LENGTH) {
            normalized = normalized.substring(0, MAX_NAME_LENGTH);
        }

        PageRequest page = PageRequest.of(0, MAX_RESULTS);
        List<StoreNameSuggestion> found = normalized.isEmpty()
                ? repository.findTopVisible(page)
                : repository.search(escapeLike(normalized), page);

        return found.stream().map(s -> new StoreNameSuggestionDto(s.getName())).toList();
    }

    private static String escapeLike(String value) {
        return value.replace("!", "!!").replace("%", "!%").replace("_", "!_");
    }
}
