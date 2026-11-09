package disscount.shoppingList.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.exceptions.ForbiddenException;
import disscount.shoppingList.dao.ShoppingListRepository;
import disscount.shoppingList.domain.ListAccess;
import disscount.shoppingList.domain.ShoppingList;
import disscount.shoppingList.dto.ShoppingListCopyRequest;
import disscount.shoppingList.dto.ShoppingListDto;
import disscount.shoppingListItem.domain.ShoppingListItem;
import disscount.user.domain.User;

import java.util.UUID;

/** Its own service: it reads someone else's list in one transaction, so a failure leaves no half-filled copy. */
@Service
@RequiredArgsConstructor
@Transactional
public class ShoppingListCopyService {

    private final ShoppingListRepository shoppingListRepository;
    private final ShoppingListAccessService accessService;
    private final ShoppingListService shoppingListService;
    private final ShoppingListMapper shoppingListMapper;

    public ShoppingListDto copy(UUID listId, UUID userId, ShoppingListCopyRequest request) {
        ShoppingList source = shoppingListService.findVisible(listId, userId);
        User owner = shoppingListService.requireWriteUser(userId);

        // Only an owner may carry sharing across, or a recipient could hand out a link the owner never chose.
        if (request.isIncludeSharing() && !accessService.resolve(source, userId).isOwner()) {
            throw new ForbiddenException("error.shoppingList.ownerOnlyCopySharing");
        }

        ShoppingList copy = ShoppingList.builder()
                .owner(owner)
                .title(request.getTitle())
                .linkAccess(request.isIncludeSharing() ? source.getLinkAccess() : null)
                .build();

        if (request.isIncludeItems()) {
            source.getItems().stream()
                    .filter(item -> item.getDeletedAt() == null)
                    .map(item -> copyItem(item, copy, owner, request.isIncludeProgress()))
                    .forEach(copy.getItems()::add);
        }

        // Cascades to the items, so the list and everything on it commit as one.
        return shoppingListMapper.toDto(shoppingListRepository.save(copy), ListAccess.OWNER);
    }

    private ShoppingListItem copyItem(
            ShoppingListItem source, ShoppingList target, User actor, boolean includeProgress) {
        return ShoppingListItem.builder()
                .shoppingList(target)
                .ean(source.getEan())
                .brand(source.getBrand())
                .name(source.getName())
                .quantity(source.getQuantity())
                .unit(source.getUnit())
                .amount(source.getAmount())
                // All four move together, because a tick without its price is a claim with no evidence.
                .isChecked(includeProgress ? source.getIsChecked() : false)
                .chainCode(includeProgress ? source.getChainCode() : null)
                .avgPrice(includeProgress ? source.getAvgPrice() : null)
                .storePrice(includeProgress ? source.getStorePrice() : null)
                .updatedByUser(actor)
                .build();
    }
}
