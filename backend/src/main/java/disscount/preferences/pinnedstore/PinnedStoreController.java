package disscount.preferences.pinnedstore;

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
@RequestMapping("/api/pinned-stores")
@RequiredArgsConstructor
@Tag(name = "Pinned Stores", description = "User pinned stores management endpoints")
class PinnedStoreController {

    private final PinnedStoreService pinnedStoreService;

    @Operation(summary = "Update user's pinned stores (bulk operation)")
    @PutMapping("/bulk")
    public ResponseEntity<List<PinnedStoreDto>> updatePinnedStores(
            @CurrentUser UUID userId,
            @Valid @RequestBody BulkPinnedStoreRequest request) {
        List<PinnedStoreDto> pinned = pinnedStoreService.updatePinnedStores(userId, request);
        return ResponseEntity.ok(pinned);
    }

    @Operation(summary = "Get current user's pinned stores")
    @GetMapping("/me")
    public ResponseEntity<List<PinnedStoreDto>> getCurrentUserPinnedStores(@CurrentUser UUID userId) {
        List<PinnedStoreDto> pinnedStores = pinnedStoreService.getUserPinnedStores(userId);
        return ResponseEntity.ok(pinnedStores);
    }
}
