package disscount.shoppingListItem.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.exceptions.ForbiddenException;
import disscount.exceptions.NotFoundException;
import disscount.exceptions.UnauthorizedException;
import disscount.shoppingList.dao.ShoppingListRepository;
import disscount.shoppingList.domain.ListAccess;
import disscount.shoppingList.domain.ShoppingList;
import disscount.shoppingList.service.ShoppingListAccessService;
import disscount.shoppingList.service.ShoppingListMapper;
import disscount.shoppingList.service.ShoppingListService;
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
 * Items on a list, for owners and link visitors alike.
 *
 * <p>Like {@link ShoppingListService}, these run where a bearer token is optional, so each
 * method resolves the caller's access rather than assuming an owner. The list is loaded
 * through {@code findVisible}, which answers not-found for anything the caller may not see,
 * so an item endpoint cannot be used to probe for list ids either.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ShoppingListItemService {

    private final ShoppingListItemRepository shoppingListItemRepository;
    private final ShoppingListRepository shoppingListRepository;
    private final UserRepository userRepository;
    private final ShoppingListAccessService accessService;
    private final ShoppingListService shoppingListService;
    private final ShoppingListMapper shoppingListMapper;

    /**
     * Owner only. No link level grants item creation: an unbounded right to add to someone
     * else's list waits for per-person revocation, which is version 2's job.
     */
    public ShoppingListItemDto addItemToShoppingList(UUID shoppingListId, UUID userId, ShoppingListItemRequest request) {
        ShoppingList shoppingList = shoppingListService.findVisible(shoppingListId, userId);
        User actor = shoppingListService.requireWriteUser(userId);

        if (!accessService.resolve(shoppingList, userId).isOwner()) {
            throw new ForbiddenException("Only the owner can add items to this shopping list");
        }

        Optional<ShoppingListItem> existingItem = shoppingListItemRepository
                .findActiveByShoppingListAndName(shoppingList, request.getName());

        ShoppingListItem item;
        if (existingItem.isPresent()) {
            item = existingItem.get();
            int requestedAmount = request.getAmount() != null ? request.getAmount() : 1;
            // Cap the merged total at the same limit the request DTO enforces (@Max)
            int newAmount = Math.min(item.getAmount() + requestedAmount, 999);
            item.setAmount(newAmount);

            if (request.getEan() != null) item.setEan(request.getEan());
            if (request.getBrand() != null) item.setBrand(request.getBrand());
            if (request.getQuantity() != null) item.setQuantity(request.getQuantity());
            if (request.getUnit() != null) item.setUnit(request.getUnit());
            if (request.getChainCode() != null) item.setChainCode(request.getChainCode());
            if (request.getAvgPrice() != null) item.setAvgPrice(request.getAvgPrice());
            if (request.getStorePrice() != null) item.setStorePrice(request.getStorePrice());

            item.setUpdatedAt(Timestamps.nowUtc());
            item.setUpdatedByUser(actor);
        } else {
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
                    .updatedByUser(actor)
                    .build();
        }

        item = shoppingListItemRepository.save(item);
        touchList(shoppingList);

        return shoppingListMapper.toItemDto(item, ListAccess.OWNER);
    }

    /** SHOP is enough: ticking off and choosing a store is the in-the-shop level. */
    public ShoppingListItemDto updateShoppingListItem(
            UUID listId, UUID itemId, UUID userId, ShoppingListItemRequest request) {
        ShoppingList list = shoppingListService.findVisible(listId, userId);
        User actor = shoppingListService.requireWriteUser(userId);
        ListAccess access = requireAccess(list, userId, ListAccess::canCheck);

        ShoppingListItem item = findItem(list, itemId);

        applyItemUpdate(item, request, access);
        item.setUpdatedAt(Timestamps.nowUtc());
        item.setUpdatedByUser(actor);

        item = shoppingListItemRepository.save(item);
        touchList(list);

        return shoppingListMapper.toItemDto(item, access);
    }

    public void deleteShoppingListItem(UUID listId, UUID itemId, UUID userId) {
        ShoppingList list = shoppingListService.findVisible(listId, userId);
        shoppingListService.requireWriteUser(userId);
        requireAccess(list, userId, ListAccess::canEditItems);

        ShoppingListItem item = findItem(list, itemId);

        item.setDeletedAt(Timestamps.nowUtc());
        shoppingListItemRepository.save(item);
        touchList(list);
    }

    public List<ShoppingListItemDto> getUserShoppingListItems(UUID ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        return shoppingListItemRepository.findAllActiveItemsByUser(owner)
                .stream()
                .map(item -> shoppingListMapper.toItemDto(item, ListAccess.OWNER))
                .collect(Collectors.toList());
    }

    private ShoppingListItem findItem(ShoppingList list, UUID itemId) {
        return shoppingListItemRepository.findActiveByIdAndShoppingList(itemId, list)
                .orElseThrow(() -> new NotFoundException("Shopping list item not found"));
    }

    private ListAccess requireAccess(
            ShoppingList list, UUID userId, java.util.function.Predicate<ListAccess> allowed) {
        ListAccess access = accessService.resolve(list, userId);
        if (!allowed.test(access)) {
            throw new ForbiddenException("Insufficient access to this shopping list");
        }
        return access;
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
