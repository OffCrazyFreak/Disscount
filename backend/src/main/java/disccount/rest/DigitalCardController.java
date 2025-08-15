package disccount.rest;

import disccount.dto.card.DigitalCardDto;
import disccount.dto.card.DigitalCardRequest;
import disccount.service.DigitalCardService;
import disccount.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/digital-cards")
@RequiredArgsConstructor
@Tag(name = "Digital Cards", description = "Digital card management endpoints")
public class DigitalCardController {

    private final DigitalCardService digitalCardService;

    @Operation(summary = "Create a new digital card")
    @PostMapping
    public ResponseEntity<DigitalCardDto> createCard(@Valid @RequestBody DigitalCardRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        DigitalCardDto card = digitalCardService.createCard(userId, request);
        return ResponseEntity.ok(card);
    }

    @Operation(summary = "Get all digital cards for current user")
    @GetMapping("/me")
    public ResponseEntity<List<DigitalCardDto>> getUserCards() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        List<DigitalCardDto> cards = digitalCardService.getUserCards(userId);
        return ResponseEntity.ok(cards);
    }

    @Operation(summary = "Get digital card by ID")
    @GetMapping("/{id}")
    public ResponseEntity<DigitalCardDto> getCardById(@PathVariable UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        return digitalCardService.getCardById(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Update digital card")
    @PutMapping("/{id}")
    public ResponseEntity<DigitalCardDto> updateCard(
            @PathVariable UUID id,
            @RequestBody DigitalCardRequest request) {
        
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        DigitalCardDto updatedCard = digitalCardService.updateCard(id, userId, request);
        return ResponseEntity.ok(updatedCard);
    }

    @Operation(summary = "Delete digital card (soft delete)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteCard(@PathVariable UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        digitalCardService.deleteCard(id, userId);
        return ResponseEntity.ok(Map.of("message", "Card deleted successfully"));
    }
}
