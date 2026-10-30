package disscount.favoriteStore.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import disscount.favoriteStore.dto.BulkFavoriteStoreRequest;
import disscount.favoriteStore.dto.FavoriteStoreDto;
import disscount.favoriteStore.service.FavoriteStoreService;
import disscount.util.SecurityUtils;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/favorite-stores")
@RequiredArgsConstructor
@Tag(name = "Favorite Stores", description = "The user's favourite individual stores")
public class FavoriteStoreController {

    private final FavoriteStoreService favoriteStoreService;

    @Operation(summary = "Replace the current user's favourite stores")
    @PutMapping("/bulk")
    public ResponseEntity<List<FavoriteStoreDto>> updateFavoriteStores(
            @Valid @RequestBody BulkFavoriteStoreRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(favoriteStoreService.updateFavoriteStores(userId, request));
    }

    @Operation(summary = "Get the current user's favourite stores")
    @GetMapping("/me")
    public ResponseEntity<List<FavoriteStoreDto>> getCurrentUserFavoriteStores() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(favoriteStoreService.getUserFavoriteStores(userId));
    }
}
