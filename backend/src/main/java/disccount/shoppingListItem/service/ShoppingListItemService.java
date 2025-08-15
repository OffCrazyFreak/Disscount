package disccount.shoppingListItem.service;

import disccount.shoppingListItem.dao.ShoppingListItemRepository;
import disccount.shoppingList.dao.ShoppingListRepository;
import disccount.appUser.dao.UserRepository;
import disccount.shoppingList.domain.ShoppingList;
import disccount.shoppingListItem.domain.ShoppingListItem;
import disccount.appUser.domain.User;
import disccount.shoppingListItem.dto.ShoppingListItemDto;
import disccount.shoppingListItem.dto.ShoppingListItemRequest;
import disccount.exceptions.BadRequestException;
import disccount.exceptions.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
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

        ShoppingListItem item = ShoppingListItem.builder()
                .shoppingList(shoppingList)
                .productApiId(request.getProductApiId())
                .productName(request.getProductName())
                .amount(request.getAmount() != null ? request.getAmount() : 1)
                .isChecked(request.getIsChecked() != null ? request.getIsChecked() : false)
                .build();

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

        // Update fields
        item.setProductApiId(request.getProductApiId());
        item.setProductName(request.getProductName());
        item.setAmount(request.getAmount() != null ? request.getAmount() : 1);
        item.setIsChecked(request.getIsChecked() != null ? request.getIsChecked() : false);

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
                .productApiId(item.getProductApiId())
                .productName(item.getProductName())
                .amount(item.getAmount())
                .isChecked(item.getIsChecked())
                .createdAt(item.getCreatedAt())
                .build();
    }
}
