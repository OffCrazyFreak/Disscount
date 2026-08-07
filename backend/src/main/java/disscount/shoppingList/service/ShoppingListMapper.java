package disscount.shoppingList.service;

import org.springframework.stereotype.Component;

import disscount.shoppingList.domain.ListAccess;
import disscount.shoppingList.domain.ShoppingList;
import disscount.shoppingList.dto.ShoppingListDto;
import disscount.shoppingListItem.domain.ShoppingListItem;
import disscount.shoppingListItem.dto.ShoppingListItemDto;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * One place items and lists become DTOs, so the owner view and the shared view cannot
 * drift apart in what they expose.
 */
@Component
public class ShoppingListMapper {

    public ShoppingListDto toDto(ShoppingList list, ListAccess access) {
        boolean isOwner = access == ListAccess.OWNER;

        List<ShoppingListItemDto> items = list.getItems().stream()
                .filter(item -> item.getDeletedAt() == null)
                .map(item -> toItemDto(item, access))
                .collect(Collectors.toList());

        return ShoppingListDto.builder()
                .id(list.getId())
                // Account ids are for the owner only. They are stable cross-request
                // identifiers, and a share link can travel anywhere, so a recipient
                // would otherwise be able to correlate two links as the same person.
                .ownerId(isOwner ? list.getOwner().getId() : null)
                .title(list.getTitle())
                .linkAccess(isOwner ? list.resolvedLinkAccess() : null)
                .myAccess(access)
                .updatedAt(list.getUpdatedAt())
                .createdAt(list.getCreatedAt())
                .items(items)
                .build();
    }

    public ShoppingListItemDto toItemDto(ShoppingListItem item, ListAccess access) {
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
                // Same reason as ownerId. On a SHOP or EDIT list several accounts touch
                // items, so this would hand a link visitor the account id of everyone
                // shopping it. Nothing renders attribution yet; version 2 adds it as a
                // name, not an id.
                .updatedByUserId(updatedByUserId(item, access))
                .build();
    }

    private UUID updatedByUserId(ShoppingListItem item, ListAccess access) {
        if (access != ListAccess.OWNER || item.getUpdatedByUser() == null) {
            return null;
        }
        return item.getUpdatedByUser().getId();
    }
}
