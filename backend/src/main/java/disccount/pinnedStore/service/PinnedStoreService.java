package disccount.pinnedStore.service;

import disccount.exceptions.BadRequestException;
import disccount.pinnedStore.dao.PinnedStoreRepository;
import disccount.pinnedStore.domain.PinnedStore;
import disccount.pinnedStore.dto.PinnedStoreDto;
import disccount.user.dao.UserRepository;
import disccount.user.domain.User;
import disccount.pinnedStore.dto.BulkPinnedStoreRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PinnedStoreService {

    private final PinnedStoreRepository pinnedStoreRepository;
    private final UserRepository userRepository;

    public List<PinnedStoreDto> updatePinnedStores(UUID userId, BulkPinnedStoreRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        // First, delete all existing pinned stores for this user
        List<PinnedStore> existingStores = pinnedStoreRepository.findByUserId(userId);
        pinnedStoreRepository.deleteAll(existingStores);
        pinnedStoreRepository.flush(); // Force the delete operation to complete before insert

        // Check for duplicate store IDs in the request
        long uniqueStoreIds = request.getStores().stream()
                .map(storeRequest -> storeRequest.getStoreApiId())
                .distinct()
                .count();

        if (uniqueStoreIds < request.getStores().size()) {
            throw new BadRequestException("Duplicate store IDs found in request");
        }

        // Then create new pinned stores
        List<PinnedStore> newPinnedStores = request.getStores().stream()
                .map(storeRequest -> PinnedStore.builder()
                        .user(user)
                        .storeApiId(storeRequest.getStoreApiId())
                        .storeName(storeRequest.getStoreName())
                        .build())
                .collect(Collectors.toList());

        List<PinnedStore> saved = pinnedStoreRepository.saveAll(newPinnedStores);
        return saved.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PinnedStoreDto> getUserPinnedStores(UUID userId) {
        return pinnedStoreRepository.findByUserId(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private PinnedStoreDto mapToDto(PinnedStore pinnedStore) {
        return PinnedStoreDto.builder()
                .id(pinnedStore.getId())
                .userId(pinnedStore.getUser().getId())
                .storeApiId(pinnedStore.getStoreApiId())
                .storeName(pinnedStore.getStoreName())
                .build();
    }
}
