package disscount.shoppingListItem.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.exceptions.BadRequestException;
import disscount.exceptions.UnauthorizedException;
import disscount.shoppingList.dao.ShoppingListRepository;
import disscount.shoppingList.domain.ListAccess;
import disscount.shoppingList.domain.ShoppingList;
import disscount.shoppingList.service.ShoppingListMapper;
import disscount.shoppingListItem.dao.ShoppingListItemRepository;
import disscount.shoppingListItem.domain.ShoppingListItem;
import disscount.shoppingListItem.dto.ShoppingListItemDto;
import disscount.shoppingListItem.dto.ShoppingListItemRequest;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import disscount.util.Timestamps;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * The owner's own items. Writes granted by a share link go through
 * {@link disscount.shoppingList.service.SharedShoppingListService} instead, so that the token
 * has to travel with the request.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ShoppingListItemService {

    private final ShoppingListItemRepository shoppingListItemRepository;
    private final ShoppingListRepository shoppingListRepository;
    private final UserRepository userRepository;
    private final ShoppingListMapper shoppingListMapper;

    public ShoppingListItemDto addItemToShoppingList(UUID shoppingListId, UUID ownerId, ShoppingListItemRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        ShoppingList shoppingList = shoppingListRepository.findActiveByIdAndOwner(shoppingListId, owner)
                .orElseThrow(() -> new BadRequestException("Shopping list not found or access denied"));

        // Check if item with same name already exists in the shopping list
        Optional<ShoppingListItem> existingItem = shoppingListItemRepository
                .findActiveByShoppingListAndName(shoppingList, request.getName());

        ShoppingListItem item;
        if (existingItem.isPresent()) {
            // Item exists, increase the amount
            item = existingItem.get();
            int requestedAmount = request.getAmount() != null ? request.getAmount() : 1;
            // Cap the merged total at the same limit the request DTO enforces (@Max)
            int newAmount = Math.min(item.getAmount() + requestedAmount, 999);
            item.setAmount(newAmount);

            // Update other fields with new values if provided
            if (request.getEan() != null) item.setEan(request.getEan());
            if (request.getBrand() != null) item.setBrand(request.getBrand());
            if (request.getQuantity() != null) item.setQuantity(request.getQuantity());
            if (request.getUnit() != null) item.setUnit(request.getUnit());
            if (request.getChainCode() != null) item.setChainCode(request.getChainCode());
            if (request.getAvgPrice() != null) item.setAvgPrice(request.getAvgPrice());
            if (request.getStorePrice() != null) item.setStorePrice(request.getStorePrice());

            // Update tracking fields
            item.setUpdatedAt(Timestamps.nowUtc());
            item.setUpdatedByUser(owner);
        } else {
            // Create new item
            item = ShoppingListItem.builder()
                    .shoppingList(shoppingList)
                    .ean(request.getEan())
                    .brand(request.getBrand())
                    .name(request.getName())
                    .quantity(request.getQuantity())
                    .unit(request.getUnit())
                    .amount(request.getAmount() != null ? request.getAmount() : 1)
                    .isChecked(request.getIsChecked() != null ? request.getIsChecked() : false)
                    .chainCode(request.getChainCode())
                    .avgPrice(request.getAvgPrice())
                    .storePrice(request.getStorePrice())
                    .updatedByUser(owner)
                    .build();
        }

        item = shoppingListItemRepository.save(item);

        // Update the shopping list's updatedAt timestamp
        shoppingList.setUpdatedAt(Timestamps.nowUtc());
        shoppingListRepository.save(shoppingList);

        return shoppingListMapper.toItemDto(item, ListAccess.OWNER);
    }

    public ShoppingListItemDto updateShoppingListItem(UUID listId, UUID itemId, UUID ownerId, ShoppingListItemRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        ShoppingListItem item = findOwnedItem(listId, itemId, owner);

        // Update fields
        item.setEan(request.getEan());
        item.setBrand(request.getBrand());
        item.setName(request.getName());
        item.setQuantity(request.getQuantity());
        item.setUnit(request.getUnit());
        item.setAmount(request.getAmount() != null ? request.getAmount() : 1);
        item.setIsChecked(request.getIsChecked() != null ? request.getIsChecked() : false);
        item.setChainCode(request.getChainCode());
        item.setAvgPrice(request.getAvgPrice());
        item.setStorePrice(request.getStorePrice());

        // Update tracking fields
        item.setUpdatedAt(Timestamps.nowUtc());
        item.setUpdatedByUser(owner);

        item = shoppingListItemRepository.save(item);

        // Update the shopping list's updatedAt timestamp
        item.getShoppingList().setUpdatedAt(Timestamps.nowUtc());
        shoppingListRepository.save(item.getShoppingList());

        return shoppingListMapper.toItemDto(item, ListAccess.OWNER);
    }

    public void deleteShoppingListItem(UUID listId, UUID itemId, UUID ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        ShoppingListItem item = findOwnedItem(listId, itemId, owner);

        item.setDeletedAt(Timestamps.nowUtc());
        shoppingListItemRepository.save(item);

        // Update the shopping list's updatedAt timestamp
        item.getShoppingList().setUpdatedAt(Timestamps.nowUtc());
        shoppingListRepository.save(item.getShoppingList());
    }

    public List<ShoppingListItemDto> getUserShoppingListItems(UUID ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        return shoppingListItemRepository.findAllActiveItemsByUser(owner)
                .stream()
                .map(item -> shoppingListMapper.toItemDto(item, ListAccess.OWNER))
                .collect(Collectors.toList());
    }

    /** The item has to belong both to the list in the path and to the caller. */
    private ShoppingListItem findOwnedItem(UUID listId, UUID itemId, User owner) {
        ShoppingList shoppingList = shoppingListRepository.findActiveByIdAndOwner(listId, owner)
                .orElseThrow(() -> new BadRequestException("Shopping list not found or access denied"));

        return shoppingListItemRepository.findActiveByIdAndShoppingList(itemId, shoppingList)
                .orElseThrow(() -> new BadRequestException("Shopping list item not found or access denied"));
    }
}
