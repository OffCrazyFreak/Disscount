package disccount.pinnedStore.service;

import disccount.appUser.dao.UserRepository;
import disccount.appUser.domain.User;
import disccount.exceptions.BadRequestException;
import disccount.pinnedStore.dao.PinnedStoreRepository;
import disccount.pinnedStore.domain.PinnedStore;
import disccount.pinnedStore.dto.PinnedStoreDto;
import disccount.pinnedStore.dto.BulkPinnedStoreRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

        // First, soft delete all existing pinned stores for this user
        List<PinnedStore> existingStores = pinnedStoreRepository.findByUserId(userId);
        existingStores.forEach(store -> store.setDeletedAt(LocalDateTime.now()));
        pinnedStoreRepository.saveAll(existingStores);

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
                .createdAt(pinnedStore.getCreatedAt())
                .build();
    }
}
