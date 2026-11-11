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
@Transactional(readOnly = true)
public class PinnedStoreService {

    private final PinnedStoreRepository pinnedStoreRepository;
    private final ActiveUsers activeUsers;

    @Transactional
    public List<PinnedStoreDto> updatePinnedStores(UUID userId, BulkPinnedStoreRequest request) {
        activeUsers.lockActive(userId);

        long distinctIds = request.stores().stream().map(PinnedStoreRequest::storeApiId).distinct().count();

        if (distinctIds < request.stores().size()) {
            throw new BadRequestException("error.pinnedStore.duplicate");
        }

        pinnedStoreRepository.deleteAllByUserId(userId);
        pinnedStoreRepository.flush();

        List<PinnedStore> saved = pinnedStoreRepository.saveAll(request.stores().stream()
                .map(store -> PinnedStore.builder()
                        .userId(userId)
                        .storeApiId(store.storeApiId())
                        .storeName(store.storeName())
                        .build())
                .toList());

        return saved.stream().map(PinnedStoreDto::from).toList();
    }

    public List<PinnedStoreDto> getUserPinnedStores(UUID userId) {
        return pinnedStoreRepository.findByUserId(userId).stream()
                .map(PinnedStoreDto::from)
                .toList();
    }
}
