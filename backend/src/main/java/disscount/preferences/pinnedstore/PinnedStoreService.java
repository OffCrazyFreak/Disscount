package disscount.preferences.pinnedstore;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.shared.errors.BadRequestException;
import disscount.user.ActiveUsers;

import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

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

        List<PinnedStoreRequest> stores = request.stores();

        List<PinnedStore> saved = pinnedStoreRepository.saveAll(IntStream.range(0, stores.size())
                .mapToObj(index -> PinnedStore.builder()
                        .userId(userId)
                        .storeApiId(stores.get(index).storeApiId())
                        .storeName(stores.get(index).storeName())
                        .sortOrder(index)
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
