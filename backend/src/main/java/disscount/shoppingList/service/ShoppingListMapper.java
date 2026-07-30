package disscount.shoppingList.service;

import org.springframework.stereotype.Component;

import disscount.shoppingList.domain.ListAccess;
import disscount.shoppingList.domain.ShoppingList;
import disscount.shoppingList.dto.ShoppingListDto;
import disscount.shoppingListItem.domain.ShoppingListItem;
import disscount.shoppingListItem.dto.ShoppingListItemDto;

import java.util.List;
import java.util.stream.Collectors;

/**
 * One place items and lists become DTOs, so the owner view and the shared view cannot
 * drift apart in what they expose.
 */
@Component
public class ShoppingListMapper {

    public ShoppingListDto toDto(ShoppingList list, ListAccess access) {
        List<ShoppingListItemDto> items = list.getItems().stream()
                .filter(item -> item.getDeletedAt() == null)
                .map(this::toItemDto)
                .collect(Collectors.toList());

        boolean isOwner = access == ListAccess.OWNER;

        return ShoppingListDto.builder()
                .id(list.getId())
                .ownerId(list.getOwner().getId())
                .title(list.getTitle())
                .linkAccess(isOwner ? list.resolvedLinkAccess() : null)
                .shareToken(isOwner ? list.getShareToken() : null)
                .myAccess(access)
                .updatedAt(list.getUpdatedAt())
                .createdAt(list.getCreatedAt())
                .items(items)
                .build();
    }

    public ShoppingListItemDto toItemDto(ShoppingListItem item) {
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
