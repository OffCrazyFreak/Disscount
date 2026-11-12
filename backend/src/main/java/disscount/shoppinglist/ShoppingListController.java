package disscount.shoppinglist;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import disscount.shared.CurrentUser;
import disscount.shoppinglist.item.ShoppingListItemDto;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/shopping-lists")
@RequiredArgsConstructor
@Tag(name = "Shopping Lists", description = "Shopping list management endpoints")
class ShoppingListController {

    private final ShoppingListService shoppingListService;
    private final ShoppingListCopyService shoppingListCopyService;

    @Operation(summary = "Create a new shopping list")
    @PostMapping
    public ResponseEntity<ShoppingListDto> createShoppingList(
            @CurrentUser UUID ownerId,
            @Valid @RequestBody ShoppingListRequest request) {
        ShoppingListDto created = shoppingListService.createShoppingList(ownerId, request);
        return ResponseEntity.ok(created);
    }

    @Operation(summary = "Get current user's shopping lists")
    @GetMapping("/me")
    public ResponseEntity<List<ShoppingListDto>> getCurrentUserShoppingLists(@CurrentUser UUID ownerId) {
        List<ShoppingListDto> lists = shoppingListService.getUserShoppingLists(ownerId);
        return ResponseEntity.ok(lists);
    }

    // Runs on the optional-token chain, so callerId may be null; authorization is ShoppingListService's job.

    @Operation(summary = "Get shopping list by ID, for its owner or anyone holding a share link")
    @GetMapping("/{id}")
    public ResponseEntity<ShoppingListDto> getShoppingListById(
            @CurrentUser(required = false) UUID callerId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(shoppingListService.getShoppingListById(id, callerId));
    }

    @Operation(summary = "Copy a shopping list into a new list the caller owns")
    @PostMapping("/{id}/copy")
    public ResponseEntity<ShoppingListDto> copyShoppingList(
            @CurrentUser(required = false) UUID callerId,
            @PathVariable UUID id,
            @Valid @RequestBody ShoppingListCopyRequest request) {
        ShoppingListDto copy = shoppingListCopyService.copy(id, callerId, request);
        return ResponseEntity.ok(copy);
    }

    @Operation(summary = "Update shopping list")
    @PutMapping("/{id}")
    public ResponseEntity<ShoppingListDto> updateShoppingList(
            @CurrentUser(required = false) UUID callerId,
            @PathVariable UUID id,
            @Valid @RequestBody ShoppingListRequest request) {
        ShoppingListDto updated = shoppingListService.updateShoppingList(id, callerId, request);
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Delete shopping list")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShoppingList(
            @CurrentUser(required = false) UUID callerId,
            @PathVariable UUID id) {
        shoppingListService.deleteShoppingList(id, callerId);
        return ResponseEntity.noContent().build();
    }
    
    @Operation(summary = "Get all items from user's active shopping lists")
    @GetMapping("/items")
    public ResponseEntity<List<ShoppingListItemDto>> getAllUserShoppingListItems(@CurrentUser UUID ownerId) {
        return ResponseEntity.ok(shoppingListService.getUserShoppingListItems(ownerId));
    }
}
