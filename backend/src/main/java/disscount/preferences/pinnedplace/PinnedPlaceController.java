package disscount.preferences.pinnedplace;

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
@RequestMapping("/api/pinned-places")
@RequiredArgsConstructor
@Tag(name = "Pinned Places", description = "User pinned places management endpoints")
class PinnedPlaceController {

    private final PinnedPlaceService pinnedPlaceService;

    @Operation(summary = "Update user's pinned places (bulk operation)")
    @PutMapping("/bulk")
    public ResponseEntity<List<PinnedPlaceDto>> updatePinnedPlaces(
            @CurrentUser UUID userId,
            @Valid @RequestBody BulkPinnedPlaceRequest request) {
        return ResponseEntity.ok(pinnedPlaceService.updatePinnedPlaces(userId, request));
    }

    @Operation(summary = "Get current user's pinned places")
    @GetMapping("/me")
    public ResponseEntity<List<PinnedPlaceDto>> getCurrentUserPinnedPlaces(@CurrentUser UUID userId) {
        return ResponseEntity.ok(pinnedPlaceService.getUserPinnedPlaces(userId));
    }
}
