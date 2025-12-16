package disccount.shoppingListItem.service;

import disccount.shoppingListItem.dao.ShoppingListItemRepository;
import disccount.shoppingList.dao.ShoppingListRepository;
import disccount.shoppingList.domain.ShoppingList;
import disccount.shoppingListItem.domain.ShoppingListItem;
import disccount.shoppingListItem.dto.ShoppingListItemDto;
import disccount.shoppingListItem.dto.ShoppingListItemRequest;
import disccount.user.dao.UserRepository;
import disccount.user.domain.User;
import disccount.exceptions.BadRequestException;
import disccount.exceptions.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ShoppingListItemService {

    private final ShoppingListItemRepository shoppingListItemRepository;
    private final ShoppingListRepository shoppingListRepository;
    private final UserRepository userRepository;

    public ShoppingListItemDto addItemToShoppingList(UUID shoppingListId, UUID ownerId, ShoppingListItemRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        // First try to get as owner, then as public list
        ShoppingList shoppingList = shoppingListRepository.findActiveByIdAndOwner(shoppingListId, owner)
                .orElseGet(() -> shoppingListRepository.findActiveById(shoppingListId)
                        .filter(list -> list.getIsPublic())
                        .orElseThrow(() -> new BadRequestException("Shopping list not found or access denied")));

        // Check if item with same name already exists in the shopping list
        Optional<ShoppingListItem> existingItem = shoppingListItemRepository
                .findActiveByShoppingListAndName(shoppingList, request.getName());

        ShoppingListItem item;
        if (existingItem.isPresent()) {
            // Item exists, increase the amount
            item = existingItem.get();
            int newAmount = item.getAmount() + (request.getAmount() != null ? request.getAmount() : 1);
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
            item.setUpdatedAt(LocalDateTime.now());
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
        shoppingList.setUpdatedAt(LocalDateTime.now());
        shoppingListRepository.save(shoppingList);

        return convertToDto(item);
    }

    public ShoppingListItemDto updateShoppingListItem(UUID itemId, UUID ownerId, ShoppingListItemRequest request) {
        userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        ShoppingListItem item = shoppingListItemRepository.findActiveById(itemId)
                .filter(i -> {
                    // Allow if user is owner OR if list is public
                    return i.getShoppingList().getOwner().getId().equals(ownerId) ||
                           i.getShoppingList().getIsPublic();
                })
                .orElseThrow(() -> new BadRequestException("Shopping list item not found or access denied"));

        User currentUser = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

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
        item.setUpdatedAt(LocalDateTime.now());
        item.setUpdatedByUser(currentUser);

        item = shoppingListItemRepository.save(item);

        // Update the shopping list's updatedAt timestamp
        item.getShoppingList().setUpdatedAt(LocalDateTime.now());
        shoppingListRepository.save(item.getShoppingList());

        return convertToDto(item);
    }

    public void deleteShoppingListItem(UUID itemId, UUID ownerId) {
        userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        ShoppingListItem item = shoppingListItemRepository.findActiveById(itemId)
                .filter(i -> {
                    // Allow if user is owner OR if list is public
                    return i.getShoppingList().getOwner().getId().equals(ownerId) ||
                           i.getShoppingList().getIsPublic();
                })
                .orElseThrow(() -> new BadRequestException("Shopping list item not found or access denied"));

        item.setDeletedAt(LocalDateTime.now());
        shoppingListItemRepository.save(item);

        // Update the shopping list's updatedAt timestamp
        item.getShoppingList().setUpdatedAt(LocalDateTime.now());
        shoppingListRepository.save(item.getShoppingList());
    }

    public List<ShoppingListItemDto> getUserShoppingListItems(UUID ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        return shoppingListItemRepository.findAllActiveItemsByUser(owner)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private ShoppingListItemDto convertToDto(ShoppingListItem item) {
        return ShoppingListItemDto.builder()
                .id(item.getId())
                .shoppingListId(item.getShoppingList().getId())
                .ean(item.getEan())
                .brand(item.getBrand())
                .name(item.getName())
                .quantity(item.getQuantity())
                .unit(item.getUnit())
                .amount(item.getAmount())
                .isChecked(item.getIsChecked())
                .chainCode(item.getChainCode())
                .avgPrice(item.getAvgPrice())
                .storePrice(item.getStorePrice())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .updatedByUserId(item.getUpdatedByUser() != null ? item.getUpdatedByUser().getId() : null)
                .build();
    }
}
