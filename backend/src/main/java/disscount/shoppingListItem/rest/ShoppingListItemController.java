package disscount.shoppingListItem.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import disscount.shoppingListItem.dto.ShoppingListItemDto;
import disscount.shoppingListItem.dto.ShoppingListItemRequest;
import disscount.shoppingListItem.service.ShoppingListItemService;
import disscount.util.SecurityUtils;

import java.util.UUID;

@RestController
@RequestMapping("/api/shopping-lists/{listId}/items")
@RequiredArgsConstructor
@Tag(name = "Shopping List Items", description = "Shopping list item management endpoints")
public class ShoppingListItemController {

    private final ShoppingListItemService shoppingListItemService;

    @Operation(summary = "Add item to shopping list")
    @PostMapping
    public ResponseEntity<ShoppingListItemDto> addItemToShoppingList(
            @PathVariable UUID listId,
            @Valid @RequestBody ShoppingListItemRequest request) {
        UUID ownerId = SecurityUtils.getCurrentUserId();
        ShoppingListItemDto created = shoppingListItemService.addItemToShoppingList(listId, ownerId, request);
        return ResponseEntity.ok(created);
    }

    @Operation(summary = "Update shopping list item")
    @PutMapping("/{itemId}")
    public ResponseEntity<ShoppingListItemDto> updateShoppingListItem(
            @PathVariable UUID itemId,
            @Valid @RequestBody ShoppingListItemRequest request) {
        UUID ownerId = SecurityUtils.getCurrentUserId();
        ShoppingListItemDto updated = shoppingListItemService.updateShoppingListItem(itemId, ownerId, request);
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Delete shopping list item")
    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> deleteShoppingListItem(
            @PathVariable UUID itemId) {
        UUID ownerId = SecurityUtils.getCurrentUserId();
        shoppingListItemService.deleteShoppingListItem(itemId, ownerId);
        return ResponseEntity.noContent().build();
    }
}
