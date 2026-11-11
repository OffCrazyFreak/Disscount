package disscount.watchlist;

import disscount.shared.NotFoundException;
import disscount.shared.Timestamps;
import disscount.user.ActiveUsers;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class WatchlistItemService {

    private final WatchlistItemRepository watchlistItemRepository;
    private final ActiveUsers activeUsers;

    public WatchlistItemDto addOrUpdateWatchlist(UUID userId, WatchlistItemRequest request) {
        activeUsers.requireActive(userId);

        Optional<WatchlistItem> existing = watchlistItemRepository
                .findByProductApiIdAndWatchType(request.getProductApiId(), request.getWatchType(), userId);
        
        if (existing.isPresent()) {
            WatchlistItem watchlistItem = existing.get();
            watchlistItem.setThresholdValue(request.getThresholdValue());
            WatchlistItem saved = watchlistItemRepository.save(watchlistItem);
            return mapToDto(saved);
        }

        WatchlistItem watchlistItem = WatchlistItem.builder()
                .userId(userId)
                .productApiId(request.getProductApiId())
                .watchType(request.getWatchType())
                .thresholdValue(request.getThresholdValue())
                .build();

        WatchlistItem saved = watchlistItemRepository.save(watchlistItem);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<WatchlistItemDto> getUserWatchlist(UUID userId) {
        return watchlistItemRepository.findByUserId(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public void removeFromWatchlist(UUID id, UUID userId) {
        WatchlistItem watchlistItem = watchlistItemRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("error.watchlistItem.notFound"));

        if (watchlistItem.getDeletedAt() == null) {
            watchlistItem.setDeletedAt(Timestamps.nowUtc());
            watchlistItemRepository.save(watchlistItem);
        }
    }

    @Transactional(readOnly = true)
    public List<WatchlistItemDto> getWatchlistItemsByProductApiId(UUID userId, String productApiId) {
        List<WatchlistItem> watchlistItems = watchlistItemRepository
                .findByProductApiId(productApiId, userId);

        return watchlistItems.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private WatchlistItemDto mapToDto(WatchlistItem watchlistItem) {
        return WatchlistItemDto.builder()
                .id(watchlistItem.getId())
                .userId(watchlistItem.getUserId())
                .productApiId(watchlistItem.getProductApiId())
                .watchType(watchlistItem.getWatchType())
                .thresholdValue(watchlistItem.getThresholdValue())
                .createdAt(watchlistItem.getCreatedAt())
                .updatedAt(watchlistItem.getUpdatedAt())
                .build();
    }
}
