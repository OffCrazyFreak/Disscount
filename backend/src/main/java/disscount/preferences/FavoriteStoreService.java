package disscount.preferences;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.shared.BadRequestException;
import disscount.user.User;
import disscount.user.UserRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class FavoriteStoreService {

    private final FavoriteStoreRepository favoriteStoreRepository;
    private final UserRepository userRepository;

    /** Replaces the user's whole list, the way pinned places are saved. */
    public List<FavoriteStoreDto> updateFavoriteStores(UUID userId, BulkFavoriteStoreRequest request) {
        User user = userRepository.requireActiveForUpdate(userId);

        List<String> keys = request.getStores().stream()
                .map(FavoriteStoreRequest::getStoreKey)
                .toList();

        if (keys.stream().distinct().count() < keys.size()) {
            throw new BadRequestException("error.favoriteStore.duplicate");
        }

        favoriteStoreRepository.deleteAllByUserId(userId);
        favoriteStoreRepository.flush();

        List<FavoriteStore> saved = favoriteStoreRepository.saveAll(keys.stream()
                .map(key -> FavoriteStore.builder().user(user).storeKey(key).build())
                .toList());

        return saved.stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<FavoriteStoreDto> getUserFavoriteStores(UUID userId) {
        return favoriteStoreRepository.findByUserId(userId).stream()
                .map(this::mapToDto)
                .toList();
    }

    public void deleteAllForUser(UUID userId) {
        favoriteStoreRepository.deleteAllByUserId(userId);
    }

    private FavoriteStoreDto mapToDto(FavoriteStore favoriteStore) {
        return FavoriteStoreDto.builder()
                .id(favoriteStore.getId())
                .storeKey(favoriteStore.getStoreKey())
                .build();
    }
}
