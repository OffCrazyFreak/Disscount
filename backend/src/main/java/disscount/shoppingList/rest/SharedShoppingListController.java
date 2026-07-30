package disscount.shoppingList.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import disscount.shoppingList.dto.ShoppingListDto;
import disscount.shoppingList.dto.ShoppingListRequest;
import disscount.shoppingList.service.SharedShoppingListService;
import disscount.shoppingListItem.dto.ShoppingListItemDto;
import disscount.shoppingListItem.dto.ShoppingListItemRequest;
import disscount.util.SecurityUtils;

import java.util.UUID;

/**
 * Public entry point for shared lists. Permit-all at the filter chain; the real check is the
 * token plus {@link disscount.shoppingList.service.ShoppingListAccessService}.
 *
 * <p>Callers may be anonymous, so every method reads the user through
 * {@code getCurrentUserIdOptional()} and never {@code getCurrentUserId()}, which throws.
 */
@RestController
@RequestMapping("/api/shared")
@RequiredArgsConstructor
@Tag(name = "Shared Shopping Lists", description = "Shopping lists reachable by share token")
public class SharedShoppingListController {

    private final SharedShoppingListService sharedShoppingListService;

    @Operation(summary = "Get a shared shopping list by its share token")
    @GetMapping("/{token}")
    public ResponseEntity<ShoppingListDto> getSharedShoppingList(@PathVariable String token) {
        UUID userId = currentUserId();
        return sharedShoppingListService.getByToken(token, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Rename a shared shopping list")
    @PutMapping("/{token}")
    public ResponseEntity<ShoppingListDto> updateSharedShoppingList(
            @PathVariable String token,
            @Valid @RequestBody ShoppingListRequest request) {
        UUID userId = currentUserId();
        return sharedShoppingListService.updateTitle(token, userId, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Update an item on a shared shopping list")
    @PutMapping("/{token}/items/{itemId}")
    public ResponseEntity<ShoppingListItemDto> updateSharedItem(
            @PathVariable String token,
            @PathVariable UUID itemId,
            @Valid @RequestBody ShoppingListItemRequest request) {
        UUID userId = currentUserId();
        return sharedShoppingListService.updateItem(token, itemId, userId, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Delete an item from a shared shopping list")
    @DeleteMapping("/{token}/items/{itemId}")
    public ResponseEntity<Void> deleteSharedItem(
            @PathVariable String token,
            @PathVariable UUID itemId) {
        UUID userId = currentUserId();
        return sharedShoppingListService.deleteItem(token, itemId, userId)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    private UUID currentUserId() {
        return SecurityUtils.getCurrentUserIdOptional().orElse(null);
    }
}
