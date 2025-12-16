package disscount.watchlistItem.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.exceptions.BadRequestException;
import disscount.exceptions.ConflictException;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import disscount.watchlistItem.dao.WatchlistItemRepository;
import disscount.watchlistItem.domain.WatchlistItem;
import disscount.watchlistItem.dto.WatchlistItemDto;
import disscount.watchlistItem.dto.WatchlistItemRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class WatchlistItemService {

    private final WatchlistItemRepository watchlistItemRepository;
    private final UserRepository userRepository;

    public WatchlistItemDto addToWatchlist(UUID userId, WatchlistItemRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        // Check if product is already in user's watchlist
        Optional<WatchlistItem> existing = watchlistItemRepository
                .findByProductApiId(request.getProductApiId(), userId);
        
        if (existing.isPresent()) {
            throw new ConflictException("Product is already in your watchlist");
        }

        WatchlistItem watchlistItem = WatchlistItem.builder()
                .user(user)
                .productApiId(request.getProductApiId())
                .productName(request.getProductName())
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
        WatchlistItem watchlistItem = watchlistItemRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Watchlist item not found"));

        watchlistItem.setDeletedAt(LocalDateTime.now());
        watchlistItemRepository.save(watchlistItem);
    }

    public Optional<WatchlistItemDto> getWatchlistItemByProductApiId(UUID userId, String productApiId) {
        Optional<WatchlistItem> watchlistItem = watchlistItemRepository
                .findByProductApiId(productApiId, userId);

        return watchlistItem.map(this::mapToDto);
    }

    public void updateLastNotifiedAt(UUID watchlistItemId) {
        Optional<WatchlistItem> watchlistItem = watchlistItemRepository.findById(watchlistItemId);
        if (watchlistItem.isPresent()) {
            watchlistItem.get().setLastNotifiedAt(LocalDateTime.now());
            watchlistItemRepository.save(watchlistItem.get());
        }
    }

    private WatchlistItemDto mapToDto(WatchlistItem watchlistItem) {
        return WatchlistItemDto.builder()
                .id(watchlistItem.getId())
                .userId(watchlistItem.getUser().getId())
                .productApiId(watchlistItem.getProductApiId())
                .productName(watchlistItem.getProductName())
                .lastNotifiedAt(watchlistItem.getLastNotifiedAt())
                .createdAt(watchlistItem.getCreatedAt())
                .build();
    }
}
