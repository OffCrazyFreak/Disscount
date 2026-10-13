package disscount.digitalCard.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import disscount.digitalCard.dto.CardArchiveRequest;
import disscount.digitalCard.dto.CardPinRequest;
import disscount.digitalCard.dto.CardUsedEntry;
import disscount.digitalCard.dto.DigitalCardDto;
import disscount.digitalCard.dto.DigitalCardRequest;
import disscount.digitalCard.dto.DigitalCardsConfigDto;
import disscount.digitalCard.service.DigitalCardService;
import disscount.util.SecurityUtils;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/digital-cards")
@RequiredArgsConstructor
@Validated
@Tag(name = "Digital Cards", description = "Digital card management endpoints")
public class DigitalCardController {

    private final DigitalCardService digitalCardService;

    @Operation(summary = "Get every non-deleted card of the current user, archived included")
    @GetMapping("/me")
    public ResponseEntity<List<DigitalCardDto>> getMyCards() {
        return ResponseEntity.ok(digitalCardService.list(SecurityUtils.getCurrentUserId()));
    }

    @Operation(summary = "Feature flags for the cards UI")
    @GetMapping("/config")
    public ResponseEntity<DigitalCardsConfigDto> getConfig() {
        return ResponseEntity.ok(new DigitalCardsConfigDto(digitalCardService.photosEnabled()));
    }

    @Operation(summary = "Get a card by ID")
    @GetMapping("/{id}")
    public ResponseEntity<DigitalCardDto> getCard(@PathVariable UUID id) {
        return ResponseEntity.ok(digitalCardService.get(SecurityUtils.getCurrentUserId(), id));
    }

    @Operation(summary = "Create or update a card (idempotent, client supplied id)")
    @PutMapping("/{id}")
    public ResponseEntity<DigitalCardDto> saveCard(
            @PathVariable UUID id,
            @Valid @RequestBody DigitalCardRequest request) {
        return ResponseEntity.ok(digitalCardService.upsert(SecurityUtils.getCurrentUserId(), id, request));
    }

    @Operation(summary = "Pin or unpin a card")
    @PutMapping("/{id}/pin")
    public ResponseEntity<DigitalCardDto> pinCard(
            @PathVariable UUID id,
            @Valid @RequestBody CardPinRequest request) {
        return ResponseEntity.ok(
                digitalCardService.setPinned(SecurityUtils.getCurrentUserId(), id, request.getPinned()));
    }

    @Operation(summary = "Archive or restore a card")
    @PutMapping("/{id}/archive")
    public ResponseEntity<DigitalCardDto> archiveCard(
            @PathVariable UUID id,
            @Valid @RequestBody CardArchiveRequest request) {
        return ResponseEntity.ok(
                digitalCardService.setArchived(SecurityUtils.getCurrentUserId(), id, request.getArchived()));
    }

    @Operation(summary = "Delete a card (soft delete, photos are removed at once)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCard(@PathVariable UUID id) {
        digitalCardService.delete(SecurityUtils.getCurrentUserId(), id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Record when cards were last used, in batches of at most 50")
    @PostMapping("/used")
    public ResponseEntity<Void> recordUsed(
            @RequestBody
            @Size(min = 1, max = 50, message = "Pošalji od 1 do 50 kartica odjednom")
            List<@NotNull(message = "Unos ne smije biti prazan") @Valid CardUsedEntry> entries) {
        digitalCardService.recordUsed(SecurityUtils.getCurrentUserId(), entries);
        return ResponseEntity.noContent().build();
    }
}
