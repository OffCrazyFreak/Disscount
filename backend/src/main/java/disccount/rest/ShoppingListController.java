package disccount.rest;

import disccount.dto.shopping.ShoppingListDto;
import disccount.dto.shopping.ShoppingListItemDto;
import disccount.dto.shopping.ShoppingListRequest;
import disccount.service.ShoppingListService;
import disccount.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @Operation(summary = "Get shopping list by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ShoppingListDto> getShoppingListById(@PathVariable UUID id) {
        UUID ownerId = SecurityUtils.getCurrentUserId();
        return shoppingListService.getShoppingListById(id, ownerId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Update shopping list")
    @PutMapping("/{id}")
    public ResponseEntity<ShoppingListDto> updateShoppingList(
            @PathVariable UUID id,
            @Valid @RequestBody ShoppingListRequest request) {
        UUID ownerId = SecurityUtils.getCurrentUserId();
        ShoppingListDto updated = shoppingListService.updateShoppingList(id, ownerId, request);
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Delete shopping list")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShoppingList(@PathVariable UUID id) {
        UUID ownerId = SecurityUtils.getCurrentUserId();
        shoppingListService.deleteShoppingList(id, ownerId);
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
}
