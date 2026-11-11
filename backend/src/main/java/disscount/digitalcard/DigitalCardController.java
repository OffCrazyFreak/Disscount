package disscount.digitalcard;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import disscount.shared.CurrentUser;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/digital-cards")
@RequiredArgsConstructor
@Validated
@Tag(name = "Digital Cards", description = "Digital card management endpoints")
class DigitalCardController {

    private final DigitalCardService digitalCardService;

    @Operation(summary = "Get every non-deleted card of the current user, archived included")
    @GetMapping("/me")
    public ResponseEntity<List<DigitalCardDto>> getMyCards(@CurrentUser UUID userId) {
        return ResponseEntity.ok(digitalCardService.list(userId));
    }

    @Operation(summary = "Feature flags for the cards UI")
    @GetMapping("/config")
    public ResponseEntity<DigitalCardsConfigDto> getConfig() {
        return ResponseEntity.ok(new DigitalCardsConfigDto(digitalCardService.photosEnabled()));
    }

    @Operation(summary = "Get a card by ID")
    @GetMapping("/{id}")
    public ResponseEntity<DigitalCardDto> getCard(@CurrentUser UUID userId, @PathVariable UUID id) {
        return ResponseEntity.ok(digitalCardService.get(userId, id));
    }

    @Operation(summary = "Create or update a card (idempotent, client supplied id)")
    @PutMapping("/{id}")
    public ResponseEntity<DigitalCardDto> saveCard(
            @CurrentUser UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody DigitalCardRequest request) {
        return ResponseEntity.ok(digitalCardService.upsert(userId, id, request));
    }

    @Operation(summary = "Pin or unpin a card")
    @PutMapping("/{id}/pin")
    public ResponseEntity<DigitalCardDto> pinCard(
            @CurrentUser UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody CardPinRequest request) {
        return ResponseEntity.ok(
                digitalCardService.setPinned(userId, id, request.pinned()));
    }

    @Operation(summary = "Archive or restore a card")
    @PutMapping("/{id}/archive")
    public ResponseEntity<DigitalCardDto> archiveCard(
            @CurrentUser UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody CardArchiveRequest request) {
        return ResponseEntity.ok(
                digitalCardService.setArchived(userId, id, request.archived()));
    }

    @Operation(summary = "Delete a card (soft delete, photos are removed at once)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCard(@CurrentUser UUID userId, @PathVariable UUID id) {
        digitalCardService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Record when cards were last used, in batches of at most 50")
    @PostMapping("/used")
    public ResponseEntity<Void> recordUsed(
            @CurrentUser UUID userId,
            @RequestBody
            @Size(min = 1, max = 50, message = "{validation.card.usedBatch.size}")
            List<@NotNull(message = "{validation.card.usedEntry.empty}") @Valid CardUsedEntry> entries) {
        digitalCardService.recordUsed(userId, entries);
        return ResponseEntity.noContent().build();
    }
}
