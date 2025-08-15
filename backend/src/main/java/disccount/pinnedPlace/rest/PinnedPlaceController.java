package disccount.pinnedPlace.rest;

import disccount.pinnedPlace.dto.PinnedPlaceDto;
import disccount.pinnedPlace.dto.BulkPinnedPlaceRequest;
import disccount.pinnedPlace.service.PinnedPlaceService;
import disccount.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pinned-places")
@RequiredArgsConstructor
@Tag(name = "Pinned Places", description = "User pinned places management endpoints")
public class PinnedPlaceController {

    private final PinnedPlaceService pinnedPlaceService;

    @Operation(summary = "Update user's pinned places (bulk operation)")
    @PostMapping("/bulk")
    public ResponseEntity<List<PinnedPlaceDto>> updatePinnedPlaces(@Valid @RequestBody BulkPinnedPlaceRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<PinnedPlaceDto> pinned = pinnedPlaceService.updatePinnedPlaces(userId, request);
        return ResponseEntity.ok(pinned);
    }

    @Operation(summary = "Get current user's pinned places")
    @GetMapping("/me")
    public ResponseEntity<List<PinnedPlaceDto>> getCurrentUserPinnedPlaces() {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<PinnedPlaceDto> pinnedPlaces = pinnedPlaceService.getUserPinnedPlaces(userId);
        return ResponseEntity.ok(pinnedPlaces);
    }
}
