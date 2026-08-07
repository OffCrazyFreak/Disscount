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

/**
 * Copying a list into a new one the caller owns.
 *
 * <p>Its own service because it is the one write that reads a list belonging to somebody
 * else, and because it has to be a single transaction. It used to be a create followed by
 * one add per item from the client, which are separate transactions: a failure partway
 * left a half-populated copy behind that no retry could tidy up, and pressing the button
 * again simply made another one.
 */
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

        // Only an owner may carry sharing across. A recipient could otherwise copy a list
        // they were merely shown and hand the owner's people a link at a level the owner
        // never chose. Everything else about the copy is the caller's own, so it needs no
        // further check: they are the new list's owner by construction.
        if (request.isIncludeSharing() && !accessService.resolve(source, userId).isOwner()) {
            throw new ForbiddenException("Only the owner can copy the sharing settings");
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
                // All four move together or none do. Progress is what was ticked, where,
                // and for how much, and a tick without its price is a claim with no
                // evidence behind it.
                .isChecked(includeProgress ? source.getIsChecked() : false)
                .chainCode(includeProgress ? source.getChainCode() : null)
                .avgPrice(includeProgress ? source.getAvgPrice() : null)
                .storePrice(includeProgress ? source.getStorePrice() : null)
                .updatedByUser(actor)
                .build();
    }
}
