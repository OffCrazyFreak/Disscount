package disscount.preferences;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.shared.BadRequestException;
import disscount.user.AccountErased;
import disscount.user.ActiveUsers;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class FavoriteStoreService {

    private final FavoriteStoreRepository favoriteStoreRepository;
    private final ActiveUsers activeUsers;

    /** Replaces the user's whole list, the way pinned places are saved. */
    public List<FavoriteStoreDto> updateFavoriteStores(UUID userId, BulkFavoriteStoreRequest request) {
        activeUsers.lockActive(userId);

        List<String> keys = request.stores().stream()
                .map(FavoriteStoreRequest::storeKey)
                .toList();

        if (keys.stream().distinct().count() < keys.size()) {
            throw new BadRequestException("error.favoriteStore.duplicate");
        }

        favoriteStoreRepository.deleteAllByUserId(userId);
        favoriteStoreRepository.flush();

        List<FavoriteStore> saved = favoriteStoreRepository.saveAll(keys.stream()
                .map(key -> FavoriteStore.builder().userId(userId).storeKey(key).build())
                .toList());

        return saved.stream().map(FavoriteStoreDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<FavoriteStoreDto> getUserFavoriteStores(UUID userId) {
        return favoriteStoreRepository.findByUserId(userId).stream()
                .map(FavoriteStoreDto::from)
                .toList();
    }

    /** Favourite stores show where the person shops. */
    @EventListener
    @Order(30)
    public void onAccountErased(AccountErased erased) {
        deleteAllForUser(erased.userId());
    }

    public void deleteAllForUser(UUID userId) {
        favoriteStoreRepository.deleteAllByUserId(userId);
    }
}
