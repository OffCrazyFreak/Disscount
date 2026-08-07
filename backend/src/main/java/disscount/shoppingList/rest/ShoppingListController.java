package disscount.shoppingList.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import disscount.shoppingList.dto.ShoppingListDto;
import disscount.shoppingList.dto.ShoppingListRequest;
import disscount.shoppingList.service.ShoppingListService;
import disscount.shoppingListItem.dto.ShoppingListItemDto;
import disscount.util.SecurityUtils;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/shopping-lists")
@RequiredArgsConstructor
@Tag(name = "Shopping Lists", description = "Shopping list management endpoints")
public class ShoppingListController {

    private final ShoppingListService shoppingListService;

    @Operation(summary = "Create a new shopping list")
    @PostMapping
    public ResponseEntity<ShoppingListDto> createShoppingList(@Valid @RequestBody ShoppingListRequest request) {
        UUID ownerId = SecurityUtils.getCurrentUserId();
        ShoppingListDto created = shoppingListService.createShoppingList(ownerId, request);
        return ResponseEntity.ok(created);
    }

    @Operation(summary = "Get current user's shopping lists")
    @GetMapping("/me")
    public ResponseEntity<List<ShoppingListDto>> getCurrentUserShoppingLists() {
        UUID ownerId = SecurityUtils.getCurrentUserId();
        List<ShoppingListDto> lists = shoppingListService.getUserShoppingLists(ownerId);
        return ResponseEntity.ok(lists);
    }

    // The three by-id endpoints run on the chain where a bearer token is optional, so the
    // caller may be anonymous and currentUserId() may be null. Authorization is entirely
    // ShoppingListService's job; nothing here may assume an owner.

    @Operation(summary = "Get shopping list by ID, for its owner or anyone holding a share link")
    @GetMapping("/{id}")
    public ResponseEntity<ShoppingListDto> getShoppingListById(@PathVariable UUID id) {
        return ResponseEntity.ok(shoppingListService.getShoppingListById(id, currentUserId()));
    }

    @Operation(summary = "Update shopping list")
    @PutMapping("/{id}")
    public ResponseEntity<ShoppingListDto> updateShoppingList(
            @PathVariable UUID id,
            @Valid @RequestBody ShoppingListRequest request) {
        ShoppingListDto updated = shoppingListService.updateShoppingList(id, currentUserId(), request);
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Delete shopping list")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShoppingList(@PathVariable UUID id) {
        shoppingListService.deleteShoppingList(id, currentUserId());
        return ResponseEntity.noContent().build();
    }
    
    // reccomendations for watchlist
    @Operation(summary = "Get all items from user's active shopping lists")
    @GetMapping("/items")
    public ResponseEntity<List<ShoppingListItemDto>> getAllUserShoppingListItems() {
        UUID ownerId = SecurityUtils.getCurrentUserId();
        List<ShoppingListDto> lists = shoppingListService.getUserShoppingLists(ownerId);
        List<ShoppingListItemDto> items = lists.stream()
                .flatMap(list -> list.getItems().stream())
                .collect(Collectors.toList());
        return ResponseEntity.ok(items);
    }

    /** Null for an anonymous caller on the by-id routes, which is a legitimate state there. */
    private UUID currentUserId() {
        return SecurityUtils.getCurrentUserIdOptional().orElse(null);
    }
}
