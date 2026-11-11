package disscount.preferences;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.shared.BadRequestException;
import disscount.user.ActiveUsers;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PinnedStoreService {

    private final PinnedStoreRepository pinnedStoreRepository;
    private final ActiveUsers activeUsers;

    public List<PinnedStoreDto> updatePinnedStores(UUID userId, BulkPinnedStoreRequest request) {
        activeUsers.lockActive(userId);

        long distinctIds = request.getStores().stream().map(PinnedStoreRequest::getStoreApiId).distinct().count();

        if (distinctIds < request.getStores().size()) {
            throw new BadRequestException("error.pinnedStore.duplicate");
        }

        pinnedStoreRepository.deleteAllByUserId(userId);
        pinnedStoreRepository.flush();

        List<PinnedStore> saved = pinnedStoreRepository.saveAll(request.getStores().stream()
                .map(store -> PinnedStore.builder()
                        .userId(userId)
                        .storeApiId(store.getStoreApiId())
                        .storeName(store.getStoreName())
                        .build())
                .toList());

        return saved.stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<PinnedStoreDto> getUserPinnedStores(UUID userId) {
        return pinnedStoreRepository.findByUserId(userId).stream()
                .map(this::mapToDto)
                .toList();
    }

    private PinnedStoreDto mapToDto(PinnedStore pinnedStore) {
        return PinnedStoreDto.builder()
                .id(pinnedStore.getId())
                .userId(pinnedStore.getUserId())
                .storeApiId(pinnedStore.getStoreApiId())
                .storeName(pinnedStore.getStoreName())
                .build();
    }
}
