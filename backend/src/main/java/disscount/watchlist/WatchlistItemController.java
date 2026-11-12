package disscount.watchlist;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import disscount.shared.CurrentUser;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/watchlist")
@RequiredArgsConstructor
@Tag(name = "Watchlist", description = "User watchlist management endpoints")
class WatchlistItemController {

    private final WatchlistItemService watchlistItemService;

    @Operation(summary = "Add product to watchlist or update existing threshold")
    @PostMapping
    public ResponseEntity<WatchlistItemDto> addOrUpdateWatchlist(
            @CurrentUser UUID userId,
            @Valid @RequestBody WatchlistItemRequest request) {
        WatchlistItemDto watchlistItem = watchlistItemService.addOrUpdateWatchlist(userId, request);
        return ResponseEntity.ok(watchlistItem);
    }

    @Operation(summary = "Get current user's watchlist")
    @GetMapping("/me")
    public ResponseEntity<List<WatchlistItemDto>> getCurrentUserWatchlist(@CurrentUser UUID userId) {
        List<WatchlistItemDto> watchlist = watchlistItemService.getUserWatchlist(userId);
        return ResponseEntity.ok(watchlist);
    }

    @Operation(summary = "Remove product from watchlist")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeFromWatchlist(@CurrentUser UUID userId, @PathVariable UUID id) {
        watchlistItemService.removeFromWatchlist(id, userId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Fetch watchlist items for a product by product API ID")
    @GetMapping("/product/{productApiId}")
    public ResponseEntity<List<WatchlistItemDto>> getWatchlistItemsByProductApiId(
            @CurrentUser UUID userId,
            @PathVariable String productApiId) {
        List<WatchlistItemDto> watchlistItems = watchlistItemService.getWatchlistItemsByProductApiId(userId, productApiId);
        return ResponseEntity.ok(watchlistItems);
    }
}
