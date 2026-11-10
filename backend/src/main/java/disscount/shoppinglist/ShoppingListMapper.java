package disscount.shoppinglist;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/** One place, so the owner view and shared view cannot drift apart in what they expose. */
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
                // Owner only: ids are stable and links travel, so a recipient could correlate two links as one person.
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
                // As with ownerId: on SHOP or EDIT lists this would hand visitors everyone's account id.
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
