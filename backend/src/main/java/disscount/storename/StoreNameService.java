package disscount.storename;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import disscount.shared.errors.BadRequestException;
import disscount.user.AccountErased;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoreNameService {

    private static final int MAX_RESULTS = 50;
    private static final int MAX_NAME_LENGTH = 60;

    private final StoreNameSuggestionRepository repository;
    private final StoreNameUsageRepository usageRepository;
    private final StoreNameUpsert upsert;

    /** Its own transaction so a duplicate-key race cannot roll back the card save; the loser retries once. */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
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

    /** A custom store name can say where the person shops, so their uses go and the counts drop with them. */
    @EventListener
    @Order(20)
    @Transactional
    public void onAccountErased(AccountErased erased) {
        forgetUser(erased.userId());
    }

    /** Joins the caller's transaction so the usage rows and the counts they gave go together. */
    @Transactional
    public void forgetUser(UUID userId) {
        repository.decrementForUser(userId);
        usageRepository.deleteAllByUserId(userId);
    }

    public List<StoreNameSuggestionDto> search(String query) {
        if (query != null && query.indexOf('\u0000') >= 0) {
            throw new BadRequestException("error.storeName.invalidCharacter");
        }
        String normalized = StoreNameNormalizer.normalize(query == null ? "" : query);
        if (normalized.length() > MAX_NAME_LENGTH) {
            normalized = normalized.substring(0, MAX_NAME_LENGTH);
        }

        PageRequest page = PageRequest.of(0, MAX_RESULTS);
        List<StoreNameSuggestion> found = normalized.isEmpty()
                ? repository.findTopVisible(page)
                : repository.search(escapeLike(normalized), page);

        return found.stream().map(StoreNameSuggestionDto::from).toList();
    }

    private static String escapeLike(String value) {
        return value.replace("!", "!!").replace("%", "!%").replace("_", "!_");
    }
}
