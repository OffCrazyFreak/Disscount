package disscount.digitalCard.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import disscount.digitalCard.dto.DigitalCardDto;
import disscount.digitalCard.dto.DigitalCardRequest;
import disscount.digitalCard.service.DigitalCardService;
import disscount.util.SecurityUtils;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/digital-cards")
@RequiredArgsConstructor
@Tag(name = "Digital Cards", description = "Loyalty card wallet endpoints")
public class DigitalCardController {

    private final DigitalCardService digitalCardService;

    @Operation(summary = "Create a new digital card")
    @PostMapping
    public ResponseEntity<DigitalCardDto> createCard(@Valid @RequestBody DigitalCardRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        DigitalCardDto created = digitalCardService.createCard(userId, request);
        return ResponseEntity.ok(created);
    }

    @Operation(summary = "Get current user's digital cards")
    @GetMapping("/me")
    public ResponseEntity<List<DigitalCardDto>> getCurrentUserCards() {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<DigitalCardDto> cards = digitalCardService.getUserCards(userId);
        return ResponseEntity.ok(cards);
    }

    @Operation(summary = "Update digital card")
    @PutMapping("/{id}")
    public ResponseEntity<DigitalCardDto> updateCard(
            @PathVariable UUID id,
            @Valid @RequestBody DigitalCardRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        DigitalCardDto updated = digitalCardService.updateCard(id, userId, request);
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Delete digital card")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCard(@PathVariable UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        digitalCardService.deleteCard(id, userId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Pin digital card")
    @PatchMapping("/{id}/pin")
    public ResponseEntity<DigitalCardDto> pinCard(@PathVariable UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(digitalCardService.setPinned(id, userId, true));
    }

    @Operation(summary = "Unpin digital card")
    @PatchMapping("/{id}/unpin")
    public ResponseEntity<DigitalCardDto> unpinCard(@PathVariable UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(digitalCardService.setPinned(id, userId, false));
    }
}
