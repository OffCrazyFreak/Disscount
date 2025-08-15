package disccount.watchlistItem.rest;

import disccount.watchlistItem.dto.WatchlistItemDto;
import disccount.watchlistItem.dto.WatchlistItemRequest;
import disccount.watchlistItem.service.WatchlistItemService;
import disccount.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/watchlist")
@RequiredArgsConstructor
@Tag(name = "Watchlist", description = "User watchlist management endpoints")
public class WatchlistItemController {

    private final WatchlistItemService watchlistItemService;

    @Operation(summary = "Add product to watchlist")
    @PostMapping
    public ResponseEntity<WatchlistItemDto> addToWatchlist(@Valid @RequestBody WatchlistItemRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        WatchlistItemDto created = watchlistItemService.addToWatchlist(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(summary = "Get current user's watchlist")
    @GetMapping("/me")
    public ResponseEntity<List<WatchlistItemDto>> getCurrentUserWatchlist() {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<WatchlistItemDto> watchlist = watchlistItemService.getUserWatchlist(userId);
        return ResponseEntity.ok(watchlist);
    }

    @Operation(summary = "Remove product from watchlist")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeFromWatchlist(@PathVariable UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        watchlistItemService.removeFromWatchlist(id, userId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Fetch product from watchlist by product API ID")
    @GetMapping("/product/{productApiId}")
    public ResponseEntity<WatchlistItemDto> getWatchlistItemByProductApiId(@PathVariable String productApiId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return watchlistItemService.getWatchlistItemByProductApiId(userId, productApiId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
