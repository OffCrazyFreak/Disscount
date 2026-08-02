package disscount.shoppingList.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.exceptions.ForbiddenException;
import disscount.exceptions.UnauthorizedException;
import disscount.shoppingList.dao.ShoppingListRepository;
import disscount.shoppingList.domain.ListAccess;
import disscount.shoppingList.domain.ShoppingList;
import disscount.shoppingList.dto.ShoppingListDto;
import disscount.shoppingList.dto.ShoppingListRequest;
import disscount.shoppingListItem.dao.ShoppingListItemRepository;
import disscount.shoppingListItem.domain.ShoppingListItem;
import disscount.shoppingListItem.dto.ShoppingListItemDto;
import disscount.shoppingListItem.dto.ShoppingListItemRequest;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import disscount.util.Timestamps;

import java.util.Optional;
import java.util.UUID;
import java.util.function.Predicate;

/**
 * Everything reachable through a share token. The token is the capability, so it travels on
 * every call here and knowing a list's id is never enough on its own.
 *
 * <p>An unresolvable token yields an empty Optional, which the controller turns into a 404
 * rather than a 403, so the endpoint never confirms that a token once existed.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SharedShoppingListService {

    private final ShoppingListRepository shoppingListRepository;
    private final ShoppingListItemRepository shoppingListItemRepository;
    private final UserRepository userRepository;
    private final ShoppingListAccessService accessService;
    private final ShoppingListMapper shoppingListMapper;

    @Transactional(readOnly = true)
    public Optional<ShoppingListDto> getByToken(String token, UUID userId) {
        return findShared(token)
                .map(list -> shoppingListMapper.toDto(list, accessService.resolve(list, userId)));
    }

    public Optional<ShoppingListDto> updateTitle(String token, UUID userId, ShoppingListRequest request) {
        return findShared(token).map(list -> {
            ListAccess access = requireAccess(list, userId, ListAccess::canEditItems);

            list.setTitle(request.getTitle());
            return shoppingListMapper.toDto(shoppingListRepository.save(list), access);
        });
    }

    public Optional<ShoppingListItemDto> updateItem(
            String token, UUID itemId, UUID userId, ShoppingListItemRequest request) {
        return findShared(token).flatMap(list -> {
            ListAccess access = requireAccess(list, userId, ListAccess::canCheck);
            User actor = requireUser(userId);

            return shoppingListItemRepository.findActiveByIdAndShoppingList(itemId, list).map(item -> {
                applyItemUpdate(item, request, access);
                item.setUpdatedAt(Timestamps.nowUtc());
                item.setUpdatedByUser(actor);

                ShoppingListItem saved = shoppingListItemRepository.save(item);
                touchList(list);
                return shoppingListMapper.toItemDto(saved);
            });
        });
    }

    public boolean deleteItem(String token, UUID itemId, UUID userId) {
        return findShared(token).map(list -> {
            requireAccess(list, userId, ListAccess::canEditItems);

            return shoppingListItemRepository.findActiveByIdAndShoppingList(itemId, list).map(item -> {
                item.setDeletedAt(Timestamps.nowUtc());
                shoppingListItemRepository.save(item);
                touchList(list);
                return true;
            }).orElse(false);
        }).orElse(false);
    }

    /**
     * A list is reachable by token only while it is actually shared. The token is nulled
     * whenever link access goes back to NONE, so this is belt and braces.
     */
    private Optional<ShoppingList> findShared(String token) {
        UUID parsed;
        try {
            parsed = UUID.fromString(token);
        } catch (IllegalArgumentException ex) {
            // A malformed token is indistinguishable from an unknown one, by design.
            return Optional.empty();
        }

        return shoppingListRepository.findActiveByShareToken(parsed)
                .filter(list -> list.resolvedLinkAccess() != ListAccess.NONE);
    }

    private ListAccess requireAccess(ShoppingList list, UUID userId, Predicate<ListAccess> allowed) {
        ListAccess access = accessService.resolve(list, userId);
        if (!allowed.test(access)) {
            throw new ForbiddenException("Insufficient access to this shopping list");
        }
        return access;
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    /**
     * SHOP is the in-the-shop level: what got ticked, which store it is coming from, and the
     * prices captured at that moment. Everything structural is left as the server has it, so a
     * SHOP-level caller cannot rename or resize an item by sending a fuller payload.
     */
    private void applyItemUpdate(ShoppingListItem item, ShoppingListItemRequest request, ListAccess access) {
        item.setIsChecked(request.getIsChecked() != null ? request.getIsChecked() : false);
        item.setChainCode(request.getChainCode());
        item.setAvgPrice(request.getAvgPrice());
        item.setStorePrice(request.getStorePrice());

        if (!access.canEditItems()) {
            return;
        }

        item.setEan(request.getEan());
        item.setBrand(request.getBrand());
        item.setName(request.getName());
        item.setQuantity(request.getQuantity());
        item.setUnit(request.getUnit());
        item.setAmount(request.getAmount() != null ? request.getAmount() : 1);
    }

    /** Item activity reorders the owner's list index, which sorts by updatedAt. */
    private void touchList(ShoppingList list) {
        list.setUpdatedAt(Timestamps.nowUtc());
        shoppingListRepository.save(list);
    }
}
