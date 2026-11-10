package disscount.shoppinglist;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import disscount.shared.SecurityUtils;

import java.util.UUID;

@RestController
@RequestMapping("/api/shopping-lists/{listId}/items")
@RequiredArgsConstructor
@Tag(name = "Shopping List Items", description = "Shopping list item management endpoints")
public class ShoppingListItemController {

    private final ShoppingListItemService shoppingListItemService;

    // On the optional-token chain, so currentUserId() may be null; the service resolves access on each.

    @Operation(summary = "Add item to shopping list")
    @PostMapping
    public ResponseEntity<ShoppingListItemDto> addItemToShoppingList(
            @PathVariable UUID listId,
            @Valid @RequestBody ShoppingListItemRequest request) {
        ShoppingListItemDto created = shoppingListItemService.addItemToShoppingList(listId, currentUserId(), request);
        return ResponseEntity.ok(created);
    }

    @Operation(summary = "Update shopping list item")
    @PutMapping("/{itemId}")
    public ResponseEntity<ShoppingListItemDto> updateShoppingListItem(
            @PathVariable UUID listId,
            @PathVariable UUID itemId,
            @Valid @RequestBody ShoppingListItemRequest request) {
        ShoppingListItemDto updated = shoppingListItemService.updateShoppingListItem(listId, itemId, currentUserId(), request);
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Delete shopping list item")
    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> deleteShoppingListItem(
            @PathVariable UUID listId,
            @PathVariable UUID itemId) {
        shoppingListItemService.deleteShoppingListItem(listId, itemId, currentUserId());
        return ResponseEntity.noContent().build();
    }

    /** Null for an anonymous caller, which is a legitimate state on these routes. */
    private UUID currentUserId() {
        return SecurityUtils.getCurrentUserIdOptional().orElse(null);
    }
}
