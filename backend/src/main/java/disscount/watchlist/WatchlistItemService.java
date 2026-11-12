package disscount.watchlist;

import disscount.shared.errors.NotFoundException;
import disscount.shared.Timestamps;
import disscount.shared.CanonicalBarcode;
import disscount.shared.errors.UserLimit;
import disscount.user.ActiveUsers;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WatchlistItemService {

    static final String NOT_FOUND = "error.watchlistItem.notFound";

    private final WatchlistItemRepository watchlistItemRepository;
    private final ActiveUsers activeUsers;

    @Transactional
    public WatchlistItemDto addOrUpdateWatchlist(UUID userId, WatchlistItemRequest request) {
        // Held to commit, so two adds at the cap cannot both count room.
        activeUsers.lockActive(userId);
        String productApiId = CanonicalBarcode.of(request.productApiId());

        Optional<WatchlistItem> existing = watchlistItemRepository
                .findByProductApiIdAndWatchType(productApiId, request.watchType(), userId);
        
        if (existing.isPresent()) {
            WatchlistItem watchlistItem = existing.get();
            watchlistItem.setThresholdValue(request.thresholdValue());
            WatchlistItem saved = watchlistItemRepository.save(watchlistItem);
            return WatchlistItemDto.from(saved);
        }

        UserLimit.WATCHLIST_ITEMS.requireRoomFor(watchlistItemRepository.countActiveByUserId(userId), 1);

        WatchlistItem watchlistItem = WatchlistItem.builder()
                .userId(userId)
                .productApiId(productApiId)
                .watchType(request.watchType())
                .thresholdValue(request.thresholdValue())
                .build();

        WatchlistItem saved = watchlistItemRepository.save(watchlistItem);
        return WatchlistItemDto.from(saved);
    }

    public List<WatchlistItemDto> getUserWatchlist(UUID userId) {
        return watchlistItemRepository.findByUserId(userId)
                .stream()
                .map(WatchlistItemDto::from)
                .collect(Collectors.toList());
    }

    @PreAuthorize("@watchlistGuard.ownsItem(#userId, #id)")
    @Transactional
    public void removeFromWatchlist(UUID id, UUID userId) {
        WatchlistItem watchlistItem = watchlistItemRepository.findIncludingDeletedByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException(NOT_FOUND));

        if (watchlistItem.getDeletedAt() == null) {
            watchlistItem.setDeletedAt(Timestamps.nowUtc());
            watchlistItemRepository.save(watchlistItem);
        }
    }

    public List<WatchlistItemDto> getWatchlistItemsByProductApiId(UUID userId, String productApiId) {
        List<WatchlistItem> watchlistItems = watchlistItemRepository
                .findByProductApiId(CanonicalBarcode.of(productApiId), userId);

        return watchlistItems.stream()
                .map(WatchlistItemDto::from)
                .collect(Collectors.toList());
    }
}
